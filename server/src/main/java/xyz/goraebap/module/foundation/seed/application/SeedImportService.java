package xyz.goraebap.module.foundation.seed.application;

import java.time.Clock;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.module.foundation.seed.SeedAuthors;
import xyz.goraebap.module.foundation.seed.SeedFormatSpi;
import xyz.goraebap.module.foundation.seed.domain.SeedImport;
import xyz.goraebap.module.foundation.seed.domain.SeedImportRepository;
import tools.jackson.databind.JsonNode;

/**
 * Brings one seed file in, in a transaction of its own: what its shape makes and its record together, so a file that
 * fails leaves nothing behind, no record either, and is tried again once fixed.
 */
@Service
@RequiredArgsConstructor
public class SeedImportService {
    private final SeedImportRepository seedImportRepository;
    private final Clock clock;

    /** The files brought in so far, by name. */
    @Transactional(readOnly = true)
    public Map<String, SeedImport> imported() {
        return seedImportRepository.findAll().stream()
                .collect(Collectors.toMap(SeedImport::fileName, Function.identity()));
    }

    /** Brings the file in with its shape and records it; the record comes back. */
    @Transactional
    public SeedImport bring(
            String fileName, String checksum, JsonNode file, SeedFormatSpi format, SeedAuthors authors) {
        String made = format.load(file, authors);
        var record = new SeedImport(fileName, checksum, clock.instant(), format.name() + ": " + made);
        seedImportRepository.save(record);
        return record;
    }
}
