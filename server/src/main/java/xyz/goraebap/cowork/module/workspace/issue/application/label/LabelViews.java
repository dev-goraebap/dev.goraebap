package xyz.goraebap.cowork.module.workspace.issue.application.label;

import java.util.UUID;

public final class LabelViews {
    private LabelViews() {}

    /** A label as the screens show it, in the workspace's order, with how many live work items carry it. */
    public record LabelView(UUID id, String name, String color, int position, int uses) {}
}
