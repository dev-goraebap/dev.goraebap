package xyz.goraebap.cowork.module.workspace.project;

/**
 * What someone may do in one project (cowork-projects 권한), in order: NONE sees nothing of it, a VIEWER reads it and
 * comments, an EDITOR also writes its issues and documents, an ADMIN also keeps its settings and its members. A member
 * holds VIEWER, EDITOR or ADMIN; a Workspace administrator counts as ADMIN in every project.
 */
public enum ProjectRole {
    NONE,
    VIEWER,
    EDITOR,
    ADMIN;

    public boolean atLeast(ProjectRole least) {
        return compareTo(least) >= 0;
    }
}
