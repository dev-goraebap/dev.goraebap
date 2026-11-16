package xyz.goraebap.foundation.shared.persistence;

/**
 * One subproject's migrations: where they are on the classpath, and the name its record of them is kept under
 * (flyway_history_{name}). Each subproject counts its own versions from V1, so two never clash. Lower order runs
 * first: a subproject's tables are made after those of the subprojects it builds on.
 */
public record ModuleMigration(String name, String location, int order) {
    public ModuleMigration {
        if (name == null || !name.matches("[a-z][a-z0-9_]{1,30}"))
            throw new IllegalArgumentException("migration name must be lowercase letters, digits and underscores");
        if (location == null || location.isBlank()) throw new IllegalArgumentException("migration location is required");
    }

    public String historyTable() {
        return "flyway_history_" + name;
    }
}
