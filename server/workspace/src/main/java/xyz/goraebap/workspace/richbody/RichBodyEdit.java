package xyz.goraebap.workspace.richbody;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * One save of a body: over the version it was read at, the editor's body (Tiptap JSON), the uploads the body names for
 * the first time (bound to the owner), and whether to keep this body as a version.
 */
public record RichBodyEdit(long expectedVersion, Map<String, Object> body, List<UUID> uploadIds, boolean checkpoint) {
    public RichBodyEdit {
        body = body == null ? Map.of() : Map.copyOf(RichBodyJson.present(body));
        uploadIds = uploadIds == null ? List.of() : List.copyOf(uploadIds);
    }
}
