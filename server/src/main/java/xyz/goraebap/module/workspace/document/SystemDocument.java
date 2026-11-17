package xyz.goraebap.module.workspace.document;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * A system folder's document as 문서함 keeps its row: the same id as the module's own, its kind, the project it is for
 * (none, the workspace's), what its folder narrows it by (a meeting's project, a report's department), its title and
 * plain text (for search), who wrote it and when it was made, and who last changed it, when.
 */
public record SystemDocument(
        UUID id,
        SystemKind kind,
        UUID projectId,
        UUID facetId,
        String title,
        String bodyText,
        UUID authorId,
        Instant createdAt,
        UUID updatedBy,
        Instant updatedAt) {
    public SystemDocument {
        Objects.requireNonNull(id, "id");
        Objects.requireNonNull(kind, "kind");
        title = title == null || title.isBlank() ? "제목 없음" : title.strip();
        if (title.length() > 200) title = title.substring(0, 200);
        bodyText = bodyText == null ? "" : bodyText;
    }
}
