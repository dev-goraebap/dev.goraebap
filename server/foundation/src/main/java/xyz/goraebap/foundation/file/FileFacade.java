package xyz.goraebap.foundation.file;

import java.net.URI;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Files other modules bind to what they own. The file module checks uploads and stores the link; the owning module
 * decides who may open an owner's files before asking for a URL, since only it knows who may see the owner.
 */
public interface FileFacade {
    /**
     * Binds the member's finished uploads, in the given order, to the owner within the caller's transaction; each file
     * keeps its upload's id, so a document can point at it before it is saved. Refuses
     * uploads that are missing, someone else's, expired, not stored or whose content does not match their format, and
     * documents and pictures that with the owner's own would pass 10MB in all; recordings are not counted.
     */
    List<AttachedFile> attach(UUID uploaderId, List<UUID> uploadIds, String ownerType, UUID ownerId);

    /**
     * Binds one of the member's finished uploads as a project wiki file, the owner's single file: any document,
     * picture, slides, archive or plain text up to 50MB, not counted toward the 10MB of attach. The file keeps its
     * upload's id. Refuses what attach refuses, and recordings.
     */
    AttachedFile attachWikiFile(UUID uploaderId, UUID uploadId, String ownerType, UUID ownerId);

    /**
     * Makes the member's finished upload the owner's only picture, a JPEG square of side pixels, and discards the
     * owner's earlier files; their bytes go with the daily cleanup. Refuses what attach refuses, and a file that does
     * not decode whole to that size.
     */
    AttachedFile replacePicture(UUID uploaderId, UUID uploadId, String ownerType, UUID ownerId, int side);

    /** The owner's first file as a stream, such as a recording to transcribe; the caller closes it. */
    Optional<OpenedFile> openFirst(String ownerType, UUID ownerId);

    /** One of the owner's files as a stream, empty when the owner has no such file; the caller closes it. */
    Optional<OpenedFile> open(String ownerType, UUID ownerId, UUID attachmentId);

    /** Removes every file of the owner, bytes included, when they are no longer to be kept. */
    void discard(String ownerType, UUID ownerId, UUID actor);

    /** A file being read: what it is called, its type and size, and its bytes. */
    record OpenedFile(String filename, String contentType, long size, java.io.InputStream body) {}

    /**
     * Removes the given files of the owner, bytes included, once the caller's transaction commits; ids that are not the
     * owner's are ignored. The daily cleanup deletes the bytes again for a week, so a storage failure is retried.
     */
    void discard(String ownerType, UUID ownerId, Collection<UUID> attachmentIds, UUID actor);

    /**
     * Gives another owner of the same type its own copy of the given files of an owner, sharing their bytes, after its
     * own files: a repeating event split in two keeps the files its text shows on both sides. Returns each copied
     * file's new id by the id it was copied from; ids the owner does not keep are left out. Discarding either copy
     * leaves the other's bytes.
     */
    Map<UUID, UUID> copy(
            String ownerType, UUID fromOwnerId, UUID toOwnerId, Collection<UUID> attachmentIds, UUID actor);

    /**
     * The member's own uploads among the ids that no owner has taken yet and that have not expired, described as the
     * files they will become (an agent names them in a body it writes as Markdown, which knows only their ids). Ids
     * that are someone else's, taken or unknown are left out.
     */
    List<AttachedFile> pendingOf(UUID uploaderId, Collection<UUID> uploadIds);

    /** The files of each owner in their order, in one batch; owners without files are left out. */
    Map<UUID, List<AttachedFile>> attachmentsOf(String ownerType, Collection<UUID> ownerIds);

    /**
     * A short-lived URL for one of the owner's files, empty when the owner has no such file. The caller has already
     * checked that the member may see the owner.
     */
    Optional<URI> openUrl(String ownerType, UUID ownerId, UUID attachmentId, boolean download);
}
