package xyz.goraebap.cowork.module.seed.application;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.cowork.module.seed.SeedFormatSpi;
import xyz.goraebap.cowork.module.user.UserFacade;

/**
 * Fills a server nobody can call the API for, such as the dev server, from JSON files put in its seed folder
 * (cowork-guide-architecture, 개발 서버 채우기): app.seed.dir, by default the folder seed beside the database file. Once the
 * server is up and serving, every *.json file there not brought in yet is, each in a transaction of its own, by the
 * shape that knows it (SeedFormatSpi): the shapes that make projects first, then by file name. A file that fails is
 * logged and left without a record, to be fixed and tried on the next start; one brought in is never brought in again.
 * Without the folder, as in production, nothing happens.
 */
@Slf4j
@Component
public class SeedImporter {
    private static final String SQLITE = "jdbc:sqlite:";

    private final SeedImportService seedImportService;
    private final List<SeedFormatSpi> seedFormatSpis;
    private final UserFacade userFacade;
    private final JsonMapper jsonMapper;
    private final Optional<Path> folder;
    private final String actorEmail;

    SeedImporter(
            SeedImportService seedImportService,
            List<SeedFormatSpi> seedFormatSpis,
            UserFacade userFacade,
            JsonMapper jsonMapper,
            @Value("${app.seed.dir:}") String dir,
            @Value("${spring.datasource.url:}") String databaseUrl,
            @Value("${app.seed.actor-email:}") String actorEmail) {
        this.seedImportService = seedImportService;
        this.seedFormatSpis = seedFormatSpis;
        this.userFacade = userFacade;
        this.jsonMapper = jsonMapper;
        this.folder = folderOf(dir, databaseUrl);
        this.actorEmail = actorEmail;
    }

    @EventListener(ApplicationReadyEvent.class)
    void importOnStart() {
        importAll();
    }

    /** Brings in the seed folder's files not brought in yet; how many were comes back. */
    public int importAll() {
        var files =
                folder.filter(Files::isDirectory).map(SeedImporter::jsonFiles).orElse(List.of());
        if (files.isEmpty()) return 0;
        var imported = seedImportService.imported();
        var pending = new ArrayList<Pending>();
        for (Path path : files) {
            String name = nameOf(path);
            byte[] bytes = read(path);
            String checksum = sha256(bytes);
            var done = imported.get(name);
            if (done != null) {
                if (!done.checksum().equals(checksum))
                    log.warn("시드 {}: 가져온 뒤 바뀌었지만 다시 가져오지 않습니다. 새로 가져오려면 다른 이름으로 두세요", name);
                continue;
            }
            parsed(name, bytes).ifPresent(file -> seedFormatSpis.stream()
                    .filter(format -> format.accepts(file))
                    .findFirst()
                    .ifPresentOrElse(
                            format -> pending.add(new Pending(name, checksum, file, format)),
                            () -> log.error("시드 {}: 아는 모양이 아닙니다 (최상위 키 {})", name, file.propertyNames())));
        }
        if (pending.isEmpty()) return 0;
        var importer = userFacade.standIn(actorEmail);
        if (importer.isEmpty()) {
            log.warn("시드: 로그인할 수 있는 구성원이 없어 {}개 파일을 다음 시작으로 미룹니다", pending.size());
            return 0;
        }
        var authors = new SeedPeople(importer.get(), userFacade.activeNames());
        pending.sort(
                Comparator.comparingInt((Pending each) -> each.format().order()).thenComparing(Pending::name));
        int brought = 0;
        for (var each : pending) {
            long started = System.nanoTime();
            try {
                var record = seedImportService.bring(each.name(), each.checksum(), each.file(), each.format(), authors);
                log.info("시드 {}: {} ({}ms)", each.name(), record.summary(), (System.nanoTime() - started) / 1_000_000);
                brought++;
            } catch (RuntimeException failed) {
                // Its transaction rolled back, the file stays to be fixed and the other files still come in.
                log.error("시드 {}: 가져오지 못해 되돌렸습니다", each.name(), failed);
            }
        }
        return brought;
    }

    /** The seed folder: the one set, else seed beside the SQLite database file; none for any other database. */
    static Optional<Path> folderOf(String dir, String databaseUrl) {
        if (dir != null && !dir.isBlank()) return Optional.of(Path.of(dir.strip()));
        if (databaseUrl == null || !databaseUrl.startsWith(SQLITE)) return Optional.empty();
        String file = databaseUrl.substring(SQLITE.length());
        int query = file.indexOf('?');
        if (query >= 0) file = file.substring(0, query);
        if (file.isBlank() || file.startsWith(":memory:")) return Optional.empty();
        return Optional.of(Path.of(file).toAbsolutePath().resolveSibling("seed"));
    }

    private Optional<JsonNode> parsed(String name, byte[] bytes) {
        try {
            return Optional.of(jsonMapper.readTree(bytes));
        } catch (JacksonException invalid) {
            log.error("시드 {}: JSON으로 읽지 못했습니다: {}", name, invalid.getOriginalMessage());
            return Optional.empty();
        }
    }

    private static String nameOf(Path path) {
        return String.valueOf(path.getFileName());
    }

    private static List<Path> jsonFiles(Path dir) {
        try (Stream<Path> listed = Files.list(dir)) {
            return listed.filter(Files::isRegularFile)
                    .filter(path -> nameOf(path).endsWith(".json"))
                    .sorted()
                    .toList();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static byte[] read(Path path) {
        try {
            return Files.readAllBytes(path);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private record Pending(String name, String checksum, JsonNode file, SeedFormatSpi format) {}
}
