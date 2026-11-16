package xyz.goraebap.workspace.issue.application.type;

public final class TypeViews {
    private TypeViews() {}

    /**
     * A type as the screens show it, in the workspace's order: its code (what a work item keeps), name, mark, whether it
     * is the default, and how many work items keep it (a type in use is not deleted).
     */
    public record TypeView(
            String code, String name, String icon, String color, int position, boolean isDefault, int uses) {}
}
