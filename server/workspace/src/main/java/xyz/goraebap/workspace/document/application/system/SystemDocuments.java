package xyz.goraebap.workspace.document.application.system;

import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import xyz.goraebap.workspace.WorkspaceTransactional;
import xyz.goraebap.workspace.document.SystemDocument;
import xyz.goraebap.workspace.document.SystemDocumentFacade;
import xyz.goraebap.workspace.document.application.DocumentSpaces;

/**
 * Keeps the rows of the system folders' documents for the modules that make them, in their transaction; each change
 * tells every screen, as 문서함's own do.
 */
@Service
@RequiredArgsConstructor
public class SystemDocuments implements SystemDocumentFacade {
    private final SystemDocumentStore systemDocumentStore;
    private final DocumentSpaces documentSpaces;

    @Override
    @WorkspaceTransactional
    public void put(SystemDocument document) {
        systemDocumentStore.upsert(document);
        documentSpaces.signal(document.id());
    }

    @Override
    @WorkspaceTransactional
    public void remove(UUID id, UUID actor, Instant at) {
        systemDocumentStore.remove(id, actor, at);
        documentSpaces.signal(id);
    }
}
