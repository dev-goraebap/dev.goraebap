package xyz.goraebap.module.foundation.seed.application;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import org.junit.jupiter.api.Test;

/** Where the seed folder is: the one set, else seed beside the SQLite database file; none for another database. */
class SeedImporterTest {
    @Test
    void theFolderIsBesideTheDatabaseUnlessOneIsSet() {
        assertThat(SeedImporter.folderOf("", "jdbc:sqlite:data/foundation.db"))
                .hasValue(Path.of("data", "seed").toAbsolutePath());
        assertThat(SeedImporter.folderOf(null, "jdbc:sqlite:./data/foundation.db?foreign_keys=on")
                        .map(Path::normalize))
                .hasValue(Path.of("data", "seed").toAbsolutePath().normalize());
        assertThat(SeedImporter.folderOf(" build/seed ", "jdbc:sqlite:data/foundation.db"))
                .hasValue(Path.of("build", "seed"));
        assertThat(SeedImporter.folderOf("", "jdbc:sqlite::memory:")).isEmpty();
        assertThat(SeedImporter.folderOf("", "jdbc:postgresql://db/foundation")).isEmpty();
    }
}
