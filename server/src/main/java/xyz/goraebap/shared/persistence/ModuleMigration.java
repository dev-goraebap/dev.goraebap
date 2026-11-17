package xyz.goraebap.shared.persistence;

/**
 * One set of migrations: where it is on the classpath, and the name its record is kept under
 * (flyway_history_{name}). Each set counts its own versions from V1, so two never clash. Lower order runs first: a
 * set's tables are made after those of the sets it builds on.
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
