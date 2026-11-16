package xyz.goraebap.foundation.file.application;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FileQuery {
    /** The files of the owners, each owner's in position order. */
    List<FileViews.StoredFile> findByOwners(String ownerType, Collection<UUID> ownerIds);

    Optional<FileViews.StoredFile> findOne(String ownerType, UUID ownerId, UUID attachmentId);
}
