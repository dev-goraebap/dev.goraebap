package xyz.goraebap.module.foundation.seed.infrastructure;

import static xyz.goraebap.jooq.tables.SeedImport.SEED_IMPORT;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.module.foundation.seed.domain.SeedImport;
import xyz.goraebap.module.foundation.seed.domain.SeedImportRepository;

@Repository
@RequiredArgsConstructor
class JooqSeedImportRepository implements SeedImportRepository {
    private final DSLContext dslContext;

    @Override
    public List<SeedImport> findAll() {
        return dslContext
                .selectFrom(SEED_IMPORT)
                .orderBy(SEED_IMPORT.IMPORTED_AT, SEED_IMPORT.FILE_NAME)
                .fetch(row ->
                        new SeedImport(row.getFileName(), row.getChecksum(), row.getImportedAt(), row.getSummary()));
    }

    @Override
    public void save(SeedImport seedImport) {
        dslContext
                .insertInto(SEED_IMPORT)
                .set(SEED_IMPORT.FILE_NAME, seedImport.fileName())
                .set(SEED_IMPORT.CHECKSUM, seedImport.checksum())
                .set(SEED_IMPORT.IMPORTED_AT, seedImport.importedAt())
                .set(SEED_IMPORT.SUMMARY, seedImport.summary())
                .execute();
    }
}
