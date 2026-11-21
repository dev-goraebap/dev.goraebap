package xyz.goraebap.cowork.module.seed.domain;

import java.util.List;

public interface SeedImportRepository {
    /** Every file brought in so far. */
    List<SeedImport> findAll();

    void save(SeedImport seedImport);
}
