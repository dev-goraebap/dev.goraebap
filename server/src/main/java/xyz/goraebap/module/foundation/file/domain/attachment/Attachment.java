package xyz.goraebap.module.foundation.file.domain.attachment;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import xyz.goraebap.module.foundation.file.domain.upload.FileFormat;
import xyz.goraebap.module.foundation.file.domain.upload.ImageTraits;
import xyz.goraebap.module.foundation.file.domain.upload.PendingUpload;
import xyz.goraebap.module.foundation.file.domain.upload.UploadPurpose;
import xyz.goraebap.shared.error.DomainRuleViolation;

/**
 * A stored file bound to what owns it, such as a leave request. ownerType names the kind of owner; the owning module
 * decides who may open it. The file itself is the blob the upload wrote.
 */
@Getter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@AllArgsConstructor(staticName = "fromPersistence")
public class Attachment {
    @EqualsAndHashCode.Include
    private final UUID id;

    private final UUID blobId;
    private final String ownerType;
    private final UUID ownerId;
    private final int position;
    private final String filename;
    private final FileFormat format;
    private final long size;
    private final String storageKey;
    private final UUID createdBy;
    private final ImageTraits traits;

    /**
     * Binds an upload to its owner once the storage holds size bytes starting as its format does. start is the
     * beginning of the stored file. The file keeps its upload's id, so a document written before it is saved can already
     * point at it ({@code attachment:<id>}).
     */
    public static Attachment bind(
            PendingUpload upload, String ownerType, UUID ownerId, int position, long size, byte[] start) {
        return bind(
                upload,
                ownerType,
                ownerId,
                position,
                size,
                start,
                upload.format().audio() ? UploadPurpose.AUDIO : UploadPurpose.EVIDENCE);
    }

    /** Binds an upload as bind does, held to the formats and size of the given purpose, such as a 50MB wiki file. */
    public static Attachment bind(
            PendingUpload upload,
            String ownerType,
            UUID ownerId,
            int position,
            long size,
            byte[] start,
            UploadPurpose purpose) {
        if (ownerType == null || ownerType.isBlank() || ownerId == null) throw new DomainRuleViolation("첨부할 대상이 없습니다");
        if (!purpose.accepts(upload.format())) throw new DomainRuleViolation("여기에 붙일 수 없는 파일 형식입니다");
        // The stored bytes may not exceed what the upload's kind allows, whatever size the browser announced.
        if (size <= 0 || size > purpose.maxBytes())
            throw new DomainRuleViolation("파일은 " + purpose.limitText() + "까지 올릴 수 있습니다");
        if (!upload.format().matches(start)) throw new DomainRuleViolation(upload.filename() + "의 내용이 파일 형식과 맞지 않습니다");
        return new Attachment(
                upload.id(),
                upload.blobId(),
                ownerType,
                ownerId,
                position,
                upload.filename(),
                upload.format(),
                size,
                upload.storageKey(),
                upload.uploaderId(),
                upload.traits());
    }

    /**
     * Refuses an upload that cannot be a picture before its bytes are read: a picture is a JPEG no larger than
     * AVATAR allows, whose stored bytes start as a JPEG does.
     */
    public static void requirePicture(PendingUpload upload, long size, byte[] start) {
        if (!UploadPurpose.AVATAR.accepts(upload.format())) throw new DomainRuleViolation("사진은 JPEG로 올려 주세요");
        if (size <= 0 || size > UploadPurpose.AVATAR.maxBytes())
            throw new DomainRuleViolation("사진은 " + UploadPurpose.AVATAR.limitText() + "까지 올릴 수 있습니다");
        if (!upload.format().matches(start)) throw new DomainRuleViolation(upload.filename() + "의 내용이 파일 형식과 맞지 않습니다");
    }

    /**
     * Binds an upload as the owner's only picture, a square of side pixels. width and height are what decoding the
     * stored bytes gave, not what the browser said.
     */
    public static Attachment bindPicture(
            PendingUpload upload,
            String ownerType,
            UUID ownerId,
            long size,
            byte[] start,
            int width,
            int height,
            int side) {
        if (ownerType == null || ownerType.isBlank() || ownerId == null) throw new DomainRuleViolation("첨부할 대상이 없습니다");
        requirePicture(upload, size, start);
        if (width != side || height != side) throw new DomainRuleViolation("사진은 %d×%d 크기여야 합니다".formatted(side, side));
        return new Attachment(
                UUID.randomUUID(),
                upload.blobId(),
                ownerType,
                ownerId,
                0,
                upload.filename(),
                upload.format(),
                size,
                upload.storageKey(),
                upload.uploaderId(),
                upload.traits().measured(width, height));
    }
}
