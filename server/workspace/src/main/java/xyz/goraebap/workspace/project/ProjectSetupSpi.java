package xyz.goraebap.workspace.project;

import java.util.UUID;

/**
 * Implemented by a module that keeps something of its own for every project, such as the issues' board: told within
 * the transaction that made a project, so the project never exists without it.
 */
public interface ProjectSetupSpi {
    void projectCreated(UUID projectId, UUID actor);
}
