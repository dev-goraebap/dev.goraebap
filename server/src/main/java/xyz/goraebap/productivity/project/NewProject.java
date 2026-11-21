package xyz.goraebap.productivity.project;

/**
 * A project another module brings, an importer's: its key (letters and digits), name, and optionally its description
 * and mark (an icon name and a #RRGGBB colour), checked as the screens check them.
 */
public record NewProject(String key, String name, String description, String icon, String color) {}
