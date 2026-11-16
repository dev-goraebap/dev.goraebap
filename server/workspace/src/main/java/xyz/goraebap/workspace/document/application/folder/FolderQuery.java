package xyz.goraebap.workspace.document.application.folder;

import java.util.List;
import java.util.UUID;

/** Folders as the screens read them; deleted ones are never shown. */
public interface FolderQuery {
    /** Every live folder of a space (projectId null: the shared one), by name whatever its case, each once. */
    List<FolderViews.FolderRow> findAll(UUID projectId);
}
