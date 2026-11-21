package xyz.goraebap.cowork.module.seed.application;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import xyz.goraebap.cowork.module.seed.SeedAuthors;

/**
 * The members a run of the import matches names against, read once when it starts: who may sign in, by the name the
 * screens show. A name two members share is no one's, so it falls to the importer as an unknown one does.
 */
final class SeedPeople implements SeedAuthors {
    private final UUID importer;
    private final Map<String, UUID> byName = new HashMap<>();

    SeedPeople(UUID importer, Map<UUID, String> activeNames) {
        this.importer = importer;
        Set<String> shared = new HashSet<>();
        activeNames.forEach((id, name) -> {
            String key = name.strip();
            if (byName.putIfAbsent(key, id) != null) shared.add(key);
        });
        shared.forEach(byName::remove);
    }

    @Override
    public UUID importer() {
        return importer;
    }

    @Override
    public Author author(String name) {
        if (name == null || name.isBlank()) return new Author(importer, null);
        return member(name).map(id -> new Author(id, null)).orElseGet(() -> new Author(importer, name.strip()));
    }

    @Override
    public Optional<UUID> member(String name) {
        return name == null ? Optional.empty() : Optional.ofNullable(byName.get(name.strip()));
    }
}
