package xyz.goraebap.workspace.document.application;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.foundation.seed.SeedAuthors;
import xyz.goraebap.foundation.seed.SeedFormatSpi;
import xyz.goraebap.workspace.document.application.document.DocumentRequests;
import xyz.goraebap.workspace.document.application.document.DocumentService;
import xyz.goraebap.workspace.document.domain.document.Document;
import xyz.goraebap.workspace.project.NewProject;
import xyz.goraebap.workspace.project.ProjectFacade;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * A seed file of documents, as the old specs and decision records are brought:
 * {project?, documents: [{path, title, body, sourceId?, description?, date?, createdAt?, author?}]}. They go in a
 * project's space, by default the default project's (made when missing), each in the folder its path names, made when missing. A
 * document with a source id is titled "[id] title" so it is found by it; one with a description starts with it quoted.
 * One with createdAt (an ISO instant, an export's) is written then; one with a date (YYYYMMDD, a decision
 * record's) that day at 09:00 in Seoul; the others when brought in; by the importer unless an author is given.
 */
@Component
@RequiredArgsConstructor
class DocumentSeed implements SeedFormatSpi {
    /** The project whose space documents go in when the file names none: the product's own, where its specs live. */
    static final String PROJECT = "docs";

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final LocalTime WRITTEN = LocalTime.of(9, 0);

    private final ProjectFacade projectFacade;
    private final xyz.goraebap.workspace.document.domain.library.LibraryRepository libraryRepository;
    private final DocumentService documentService;
    private final JsonMapper jsonMapper;
    private final Clock clock;

    @Override
    public String name() {
        return "documents";
    }

    /** After the issue files, which may make the project with its own name and mark first. */
    @Override
    public int order() {
        return 10;
    }

    @Override
    public boolean accepts(JsonNode file) {
        return file.path("documents").isArray() && !file.has("issues");
    }

    @Override
    public String load(JsonNode node, SeedAuthors authors) {
        var file = jsonMapper.treeToValue(node, SeedFile.class);
        Instant now = clock.instant();
        var given = file.project();
        var project = projectFacade.findOrCreate(
                authors.importer(),
                now,
                given == null
                        ? new NewProject(PROJECT, PROJECT, null, null, null)
                        : new NewProject(given.key(), given.name(), given.description(), given.icon(), given.color()));
        Set<String> folders = new HashSet<>();
        for (var document : file.documents()) {
            var author = authors.author(document.author());
            Instant at = instant(document.createdAt())
                    .or(() -> written(document.date()))
                    .orElse(now);
            String path = document.path().stream()
                    .map(name -> name.replace('/', '-').strip())
                    .filter(name -> !name.isEmpty())
                    .collect(Collectors.joining("/"));

            if (!path.isEmpty()) folders.addAll(java.util.Arrays.asList(path.split("/")));
            var created = documentService.create(
                    author.id(),
                    at,
                    DocumentRequests.CreateDocument.page(project.key(), null, title(document), body(document, author)));
            if (!path.isEmpty())
                libraryRepository.assign(
                        created,
                        java.util.Arrays.stream(path.split("/"))
                                .map(libraryRepository::addLabel)
                                .distinct()
                                .toList());
        }
        return project.key() + " 문서 " + file.documents().size() + " · 라벨 " + distinct(folders);
    }

    /** How many folders the paths name, each folder on the way counted once. */
    private static int distinct(Set<String> paths) {
        Set<String> all = new HashSet<>();
        for (String path : paths) {
            int at = -1;
            while ((at = path.indexOf('/', at + 1)) >= 0) all.add(path.substring(0, at));
            all.add(path);
        }
        return all.size();
    }

    private static String title(SeedDocument document) {
        String title = Objects.requireNonNullElse(document.title(), "").strip();
        if (document.sourceId() != null && !document.sourceId().isBlank())
            title = "[" + document.sourceId().strip() + "] " + title;
        return title.length() <= Document.TITLE_MAX ? title : title.substring(0, Document.TITLE_MAX - 1) + "…";
    }

    /** The body: its description quoted first when it has one, who first wrote it when no member did, then the text. */
    private static String body(SeedDocument document, SeedAuthors.Author author) {
        var parts = new StringBuilder();
        if (document.description() != null && !document.description().isBlank())
            parts.append("> ")
                    .append(document.description().strip().replace("\n", "\n> "))
                    .append("\n\n");
        author.note().ifPresent(note -> parts.append(note).append("\n\n"));
        parts.append(Objects.requireNonNullElse(document.body(), "").strip());
        String body = parts.toString().strip();
        return body.isEmpty() ? null : body;
    }

    /** An ISO instant (2026-11-04T11:59:46.994902Z). */
    private static Optional<Instant> instant(String text) {
        if (text == null || text.isBlank()) return Optional.empty();
        try {
            return Optional.of(Instant.parse(text.strip()));
        } catch (DateTimeParseException invalid) {
            throw new IllegalArgumentException("시각을 읽지 못했습니다: " + text, invalid);
        }
    }

    /** A record's day (YYYYMMDD or YYYY-MM-DD) at 09:00 in Seoul. */
    private static Optional<Instant> written(String date) {
        if (date == null || date.isBlank()) return Optional.empty();
        String value = date.strip();
        try {
            var day = value.length() == 8
                    ? LocalDate.parse(value, DateTimeFormatter.BASIC_ISO_DATE)
                    : LocalDate.parse(value);
            return Optional.of(day.atTime(WRITTEN).atZone(SEOUL).toInstant());
        } catch (DateTimeParseException invalid) {
            throw new IllegalArgumentException("날짜를 읽지 못했습니다: " + value, invalid);
        }
    }

    record SeedFile(SeedProject project, List<SeedDocument> documents) {
        SeedFile {
            documents = documents == null ? List.of() : List.copyOf(documents);
        }
    }

    record SeedProject(String key, String name, String description, String icon, String color) {}

    record SeedDocument(
            List<String> path,
            String title,
            String body,
            String sourceId,
            String description,
            String date,
            String createdAt,
            String author) {
        SeedDocument {
            path = path == null ? List.of() : List.copyOf(path);
        }
    }
}
