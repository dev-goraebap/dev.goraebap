package xyz.goraebap.module.workspace.project;

import java.util.UUID;

/**
 * A project as other modules show it: its current key, its name, and its mark (an icon name and a #RRGGBB colour, either
 * absent; with neither the screen draws the key's first letter). archived marks one read but no longer written; deleted
 * one kept only for what still names it.
 */
public record ProjectSummary(
        UUID id, String key, String name, String icon, String color, boolean archived, boolean deleted) {}
