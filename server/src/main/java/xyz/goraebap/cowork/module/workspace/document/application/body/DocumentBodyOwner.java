package xyz.goraebap.cowork.module.workspace.document.application.body;

import java.util.UUID;
import xyz.goraebap.cowork.module.workspace.richbody.RichBodyOwner;

/** Whose body a document's is: the document's (PROJECT_DOCUMENT), its files opened at /api/v1/workspace/documents/{id}/files. */
public final class DocumentBodyOwner {
    /** The file owner type of a document's body files, and the owner type of its body. */
    public static final String TYPE = "PROJECT_DOCUMENT";

    private DocumentBodyOwner() {}

    public static RichBodyOwner of(UUID documentId) {
        return new RichBodyOwner(TYPE, documentId, "/api/v1/workspace/documents/" + documentId + "/files");
    }
}
