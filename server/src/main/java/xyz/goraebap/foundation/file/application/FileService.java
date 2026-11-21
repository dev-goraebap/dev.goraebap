package xyz.goraebap.foundation.file.application;

import java.io.InputStream;
import java.net.URI;
import java.time.Clock;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import xyz.goraebap.foundation.file.AttachedFile;
import xyz.goraebap.foundation.file.FileFacade;
import xyz.goraebap.foundation.file.domain.attachment.Attachment;
import xyz.goraebap.foundation.file.domain.attachment.AttachmentRepository;
import xyz.goraebap.foundation.file.domain.upload.FileFormat;
import xyz.goraebap.foundation.file.domain.upload.ImageTraits;
import xyz.goraebap.foundation.file.domain.upload.PendingUpload;
import xyz.goraebap.foundation.file.domain.upload.PendingUploadRepository;
import xyz.goraebap.foundation.file.domain.upload.UploadPurpose;
import xyz.goraebap.shared.storage.ObjectStorage;
import xyz.goraebap.shared.web.CurrentUser;

/**
 * Uploads go straight from the browser to storage through a presigned URL (shared guideline 04). The owning module
 * binds them when its command succeeds, in its transaction, after this checks what storage really holds.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileService implements FileFacade {
    /** How long a browser has to send the bytes after asking. */
    static final Duration UPLOAD_TTL = Duration.ofMinutes(10);
    /** How long an opened URL stays usable; each open asks again after authorization. */
    static final Duration OPEN_TTL = Duration.ofMinutes(5);
    /** Uploads cleaned in one run at most, so one run stays short. */
    static final int CLEANUP_BATCH = 500;
    /** How long the daily cleanup keeps deleting discarded bytes again. */
    static final Duration DISCARD_RETRIED = Duration.ofDays(7);

    private final PendingUploadRepository pendingUploadRepository;
    private final AttachmentRepository attachmentRepository;
    private final FileQuery fileQuery;
    private final ObjectStorage objectStorage;
    private final HtmlEmbeds htmlEmbeds;
    private final PictureDecoder pictureDecoder;
    private final Clock clock;

    /** Records the upload and hands out where to send it; nothing is stored until the browser sends the bytes. */
    @Transactional
    public FileViews.UploadTicket prepare(CurrentUser user, FileRequests.Upload request) {
        var upload = PendingUpload.create(
                request.filename(),
                request.size(),
                user.id(),
                clock.instant(),
                request.purpose(),
                ImageTraits.of(request.dominantColor(), request.width(), request.height()));
        pendingUploadRepository.save(upload);
        var presigned = objectStorage.presignUpload(
                upload.storageKey(), upload.format().contentType(), upload.size(), UPLOAD_TTL);
        return new FileViews.UploadTicket(
                upload.id(), presigned.url(), presigned.method(), presigned.headers(), presigned.expiresAt());
    }

    @Override
    @Transactional
    public List<AttachedFile> attach(UUID uploaderId, List<UUID> uploadIds, String ownerType, UUID ownerId) {
        if (uploadIds.isEmpty()) return List.of();
        var ids = new ArrayList<>(new LinkedHashSet<>(uploadIds));
        Map<UUID, PendingUpload> found = pendingUploadRepository.findAllByIdForUpdate(ids).stream()
                .collect(Collectors.toMap(PendingUpload::id, Function.identity()));
        var now = clock.instant();
        var attachments = new ArrayList<Attachment>();
        for (var id : ids) {
            var upload = found.get(id);
            if (upload == null || !upload.uploadedBy(uploaderId) || upload.expired(now))
                throw FileErrorCode.FILE_UPLOAD_MISSING.raise();
            var stored = objectStorage.find(upload.storageKey()).orElseThrow(FileErrorCode.FILE_NOT_STORED::raise);
            byte[] start = objectStorage.readStart(upload.storageKey(), FileFormat.SIGNATURE_LENGTH);
            attachments.add(Attachment.bind(upload, ownerType, ownerId, attachments.size(), stored.size(), start));
        }
        requireTotalWithin(ownerType, ownerId, attachments);
        attachmentRepository.saveAll(attachments);
        pendingUploadRepository.deleteAllById(ids);
        return attachments.stream().map(FileService::attached).toList();
    }

    @Override
    @Transactional
    public AttachedFile attachWikiFile(UUID uploaderId, UUID uploadId, String ownerType, UUID ownerId) {
        var upload = pendingUploadRepository.findAllByIdForUpdate(List.of(uploadId)).stream()
                .findFirst()
                .filter(found -> found.uploadedBy(uploaderId) && !found.expired(clock.instant()))
                .orElseThrow(FileErrorCode.FILE_UPLOAD_MISSING::raise);
        var stored = objectStorage.find(upload.storageKey()).orElseThrow(FileErrorCode.FILE_NOT_STORED::raise);
        byte[] start = objectStorage.readStart(upload.storageKey(), FileFormat.SIGNATURE_LENGTH);
        var attachment = Attachment.bind(upload, ownerType, ownerId, 0, stored.size(), start, UploadPurpose.WIKI);
        attachmentRepository.saveAll(List.of(attachment));
        pendingUploadRepository.deleteAllById(List.of(uploadId));
        return attached(attachment);
    }

    /**
     * Refuses when the owner's documents and pictures, those it keeps and those being added, weigh more than one
     * evidence upload may; recordings are not counted.
     */
    private void requireTotalWithin(String ownerType, UUID ownerId, List<Attachment> added) {
        long adding = added.stream()
                .filter(attachment -> !attachment.format().audio())
                .mapToLong(Attachment::size)
                .sum();
        if (adding == 0) return;
        long kept = fileQuery.findByOwners(ownerType, List.of(ownerId)).stream()
                .filter(file -> !FileFormat.ofContentType(file.contentType())
                        .map(FileFormat::audio)
                        .orElse(false))
                .mapToLong(FileViews.StoredFile::size)
                .sum();
        if (kept + adding > UploadPurpose.EVIDENCE.maxBytes()) throw FileErrorCode.FILE_TOTAL_EXCEEDED.raise();
    }

    @Override
    @Transactional
    public AttachedFile replacePicture(UUID uploaderId, UUID uploadId, String ownerType, UUID ownerId, int side) {
        var upload = pendingUploadRepository.findAllByIdForUpdate(List.of(uploadId)).stream()
                .findFirst()
                .filter(found -> found.uploadedBy(uploaderId) && !found.expired(clock.instant()))
                .orElseThrow(FileErrorCode.FILE_UPLOAD_MISSING::raise);
        var stored = objectStorage.find(upload.storageKey()).orElseThrow(FileErrorCode.FILE_NOT_STORED::raise);
        byte[] start = objectStorage.readStart(upload.storageKey(), FileFormat.SIGNATURE_LENGTH);
        // The cheap checks come first, so only a small JPEG is ever read whole and decoded.
        Attachment.requirePicture(upload, stored.size(), start);
        var decoded = pictureDecoder.decode(upload.storageKey(), stored.size());
        var picture = Attachment.bindPicture(
                upload, ownerType, ownerId, stored.size(), start, decoded.width(), decoded.height(), side);
        var earlier = fileQuery.findByOwners(ownerType, List.of(ownerId)).stream()
                .map(FileViews.StoredFile::id)
                .toList();
        attachmentRepository.deleteOfOwner(ownerType, ownerId, earlier, uploaderId);
        attachmentRepository.discardBlobs(earlier, uploaderId);
        // An earlier picture's bytes go with the daily cleanup.
        attachmentRepository.saveAll(List.of(picture));
        pendingUploadRepository.deleteAllById(List.of(uploadId));
        return attached(picture);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<FileFacade.OpenedFile> open(String ownerType, UUID ownerId, UUID attachmentId) {
        return fileQuery
                .findOne(ownerType, ownerId, attachmentId)
                .map(file -> new FileFacade.OpenedFile(
                        file.filename(), file.contentType(), file.size(), objectStorage.open(file.storageKey())));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<FileFacade.OpenedFile> openFirst(String ownerType, UUID ownerId) {
        return fileQuery.findByOwners(ownerType, List.of(ownerId)).stream()
                .findFirst()
                .map(file -> new FileFacade.OpenedFile(
                        file.filename(), file.contentType(), file.size(), objectStorage.open(file.storageKey())));
    }

    /**
     * Marks the owner's files deleted and their bytes discarded, then removes the bytes no other owner shares; the daily
     * cleanup deletes discarded bytes again for a week, so a storage failure here is retried.
     */
    @Override
    @Transactional
    public void discard(String ownerType, UUID ownerId, UUID actor) {
        var ids = fileQuery.findByOwners(ownerType, List.of(ownerId)).stream()
                .map(FileViews.StoredFile::id)
                .toList();
        attachmentRepository.deleteOfOwner(ownerType, ownerId, ids, actor);
        deleteStored(attachmentRepository.discardBlobs(ids, actor));
    }

    /**
     * Unlike discarding a whole owner, the caller may still refuse its command after this, so the bytes go only once
     * the transaction commits; a rolled-back command keeps its files whole.
     */
    @Override
    @Transactional
    public void discard(String ownerType, UUID ownerId, Collection<UUID> attachmentIds, UUID actor) {
        if (attachmentIds.isEmpty()) return;
        Set<UUID> wanted = Set.copyOf(attachmentIds);
        var files = fileQuery.findByOwners(ownerType, List.of(ownerId)).stream()
                .filter(file -> wanted.contains(file.id()))
                .toList();
        if (files.isEmpty()) return;
        var ids = files.stream().map(FileViews.StoredFile::id).toList();
        attachmentRepository.deleteOfOwner(ownerType, ownerId, ids, actor);
        var keys = attachmentRepository.discardBlobs(ids, actor);
        if (keys.isEmpty()) return;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deleteStored(keys);
            }
        });
    }

    @Override
    @Transactional
    public Map<UUID, UUID> copy(
            String ownerType, UUID fromOwnerId, UUID toOwnerId, Collection<UUID> attachmentIds, UUID actor) {
        if (attachmentIds.isEmpty()) return Map.of();
        Set<UUID> wanted = Set.copyOf(attachmentIds);
        Map<UUID, UUID> newIds = new LinkedHashMap<>();
        for (var file : fileQuery.findByOwners(ownerType, List.of(fromOwnerId)))
            if (wanted.contains(file.id())) newIds.put(file.id(), UUID.randomUUID());
        attachmentRepository.copy(ownerType, fromOwnerId, toOwnerId, newIds, actor);
        return newIds;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttachedFile> pendingOf(UUID uploaderId, Collection<UUID> uploadIds) {
        if (uploadIds.isEmpty()) return List.of();
        var now = clock.instant();
        return pendingUploadRepository.findAllByIdForUpdate(new LinkedHashSet<>(uploadIds)).stream()
                .filter(upload -> upload.uploadedBy(uploaderId) && !upload.expired(now))
                .map(upload -> {
                    var stored =
                            objectStorage.find(upload.storageKey()).orElseThrow(FileErrorCode.FILE_NOT_STORED::raise);
                    return new AttachedFile(
                            upload.id(),
                            upload.filename(),
                            upload.format().contentType(),
                            stored.size(),
                            upload.format().image(),
                            upload.traits().dominantColor(),
                            upload.traits().width(),
                            upload.traits().height());
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<UUID, List<AttachedFile>> attachmentsOf(String ownerType, Collection<UUID> ownerIds) {
        if (ownerIds.isEmpty()) return Map.of();
        Map<UUID, List<AttachedFile>> files = new LinkedHashMap<>();
        fileQuery.findByOwners(ownerType, ownerIds).forEach(file -> files.computeIfAbsent(
                        file.ownerId(), key -> new ArrayList<>())
                .add(attached(file)));
        return files;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<URI> openUrl(String ownerType, UUID ownerId, UUID attachmentId, boolean download) {
        return fileQuery
                .findOne(ownerType, ownerId, attachmentId)
                // An HTML file shown in place goes through the app (HtmlEmbeds): sandboxed, and framed by our screens.
                .map(file -> !download && file.contentType().startsWith(FileFormat.HTML.contentType())
                        ? htmlEmbeds.link(file.storageKey())
                        : objectStorage.presignDownload(
                                file.storageKey(), file.filename(), file.contentType(), download, OPEN_TTL));
    }

    /** The bytes a signed embed link names; the caller closes the stream. Empty when the link is not ours or is old. */
    Optional<InputStream> openEmbed(String token, String key) {
        return htmlEmbeds
                .storageKey(token, key)
                .filter(storageKey -> objectStorage.find(storageKey).isPresent())
                .map(objectStorage::open);
    }

    /**
     * Removes uploads nobody took within PendingUpload.KEPT, with their bytes. A storage failure leaves the row for
     * the next run.
     */
    @Transactional
    public int cleanUp() {
        var stale =
                pendingUploadRepository.findAllCreatedBefore(clock.instant().minus(PendingUpload.KEPT), CLEANUP_BATCH);
        var removed = new ArrayList<UUID>();
        for (var upload : stale) {
            try {
                objectStorage.delete(upload.storageKey());
                removed.add(upload.id());
            } catch (RuntimeException e) {
                log.warn("업로드 정리 실패: {}", upload.storageKey(), e);
            }
        }
        pendingUploadRepository.deleteAllById(removed);
        // Deleting a missing object succeeds, so bytes already gone cost only a request.
        for (var key : attachmentRepository.discardedKeysSince(clock.instant().minus(DISCARD_RETRIED), CLEANUP_BATCH)) {
            try {
                objectStorage.delete(key);
            } catch (RuntimeException e) {
                log.warn("버린 파일 정리 실패: {}", key, e);
            }
        }
        return removed.size();
    }

    private void deleteStored(List<String> keys) {
        for (var key : keys) {
            try {
                objectStorage.delete(key);
            } catch (RuntimeException e) {
                log.warn("저장소에서 파일을 지우지 못했습니다: {}", key, e);
            }
        }
    }

    private static AttachedFile attached(Attachment attachment) {
        return new AttachedFile(
                attachment.id(),
                attachment.filename(),
                attachment.format().contentType(),
                attachment.size(),
                attachment.format().image(),
                attachment.traits().dominantColor(),
                attachment.traits().width(),
                attachment.traits().height());
    }

    private static AttachedFile attached(FileViews.StoredFile file) {
        boolean image = FileFormat.ofContentType(file.contentType())
                .map(FileFormat::image)
                .orElse(false);
        return new AttachedFile(
                file.id(),
                file.filename(),
                file.contentType(),
                file.size(),
                image,
                file.dominantColor(),
                file.width(),
                file.height());
    }
}
