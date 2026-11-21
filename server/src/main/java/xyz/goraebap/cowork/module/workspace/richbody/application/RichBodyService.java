package xyz.goraebap.cowork.module.workspace.richbody.application;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.json.JsonMapper;
import xyz.goraebap.cowork.module.file.AttachedFile;
import xyz.goraebap.cowork.module.file.FileFacade;
import xyz.goraebap.cowork.module.realtime.RealtimeFacade;
import xyz.goraebap.cowork.module.realtime.Signal;
import xyz.goraebap.cowork.module.user.UserFacade;
import xyz.goraebap.cowork.module.workspace.activity.ActivityEvent;
import xyz.goraebap.cowork.module.workspace.activity.ActivityFacade;
import xyz.goraebap.cowork.module.workspace.activity.ActivityOwner;
import xyz.goraebap.cowork.module.workspace.richbody.RichBodyEdit;
import xyz.goraebap.cowork.module.workspace.richbody.RichBodyFacade;
import xyz.goraebap.cowork.module.workspace.richbody.RichBodyJson;
import xyz.goraebap.cowork.module.workspace.richbody.RichBodyOwner;
import xyz.goraebap.cowork.module.workspace.richbody.RichBodyPatch;
import xyz.goraebap.cowork.module.workspace.richbody.RichBodyState;
import xyz.goraebap.cowork.module.workspace.richbody.domain.EditingRepository;
import xyz.goraebap.cowork.module.workspace.richbody.domain.RichBlockRepository;
import xyz.goraebap.cowork.module.workspace.richbody.domain.RichBlockRepository.Block;
import xyz.goraebap.cowork.module.workspace.richbody.domain.RichBodyRepository;
import xyz.goraebap.cowork.module.workspace.richbody.domain.RichBodyRepository.Content;
import xyz.goraebap.cowork.module.workspace.richbody.domain.RichBodyRepository.Revision;

/**
 * Bodies as BIT's artifact pages keep them (V34 artifact_rich_*) and the-seed's item bodies save them: a save goes over
 * the version read, the body before its first change is kept, and a checkpoint keeps the body as a version unless the
 * newest version already is it. Each change of the body, and each restore, goes on the owner's timeline (the common
 * activity) as BODY, the version it made after it. A body names its files as attachment:{id}; a save binds the uploads it names first and refuses files the owner does
 * not have. Files stay bound while the body no longer names them, since a kept version may.
 */
@Service
@RequiredArgsConstructor
public class RichBodyService implements RichBodyFacade {
    /** The longest body, as JSON text. */
    public static final int BODY_MAX = 2_000_000;

    /** What a change of the body is called on its owner's timeline. */
    public static final String BODY_EVENT = "BODY";

    /** How many of the newest versions a body shows. */
    static final int VERSIONS_SHOWN = 50;

    private static final Pattern FILE = Pattern.compile("attachment:([0-9a-fA-F-]{36})");
    private static final Map<String, String> REASONS = Map.of(
            "baseline", "편집 시작 전",
            "automatic", "자동 저장",
            "before-restore", "복원 전 보관",
            "restored", "복원됨");
    private static final TypeReference<Map<String, Object>> OBJECT = new TypeReference<>() {};
    private static final Set<String> TEXT_BLOCKS = Set.of("paragraph", "heading", "codeBlock", "toggleSummary");

    private final EditingRepository editingRepository;
    private final RealtimeFacade realtimeFacade;
    private final UserFacade userFacade;
    private final RichBodyRepository richBodyRepository;
    private final RichBlockRepository richBlockRepository;
    private final FileFacade fileFacade;
    private final ActivityFacade activityFacade;
    private final JsonMapper jsonMapper;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public List<Editor> editors(RichBodyOwner owner) {
        var leases = editingRepository.active(
                owner.type(), owner.id(), clock.instant().minusSeconds(90));
        var names = userFacade.summariesOf(
                leases.stream().map(EditingRepository.Lease::userId).toList());
        return leases.stream()
                .map(lease -> new Editor(
                        lease.userId(),
                        names.containsKey(lease.userId())
                                ? names.get(lease.userId()).name()
                                : "알 수 없는 구성원",
                        lease.startedAt()))
                .toList();
    }

    @Override
    @Transactional
    public void editing(RichBodyOwner owner, UUID user, UUID lease) {
        var now = clock.instant();
        if (editingRepository.keep(owner.type(), owner.id(), user, lease, now, now.minusSeconds(90)))
            editingSignal(owner.type(), owner.id());
    }

    @Override
    @Transactional
    public void stopEditing(RichBodyOwner owner, UUID user, UUID lease) {
        if (editingRepository.remove(owner.type(), owner.id(), user, lease)) editingSignal(owner.type(), owner.id());
    }

    @Scheduled(fixedDelayString = "PT30S")
    @Transactional
    public void expireEditing() {
        for (var owner : editingRepository.expire(clock.instant().minusSeconds(90)))
            editingSignal(owner.type(), owner.id());
    }

    private void editingSignal(String type, UUID id) {
        realtimeFacade.signal(
                Signal.toEveryone(type.equals("PROJECT_ISSUE") ? Signal.Topic.ISSUES : Signal.Topic.DOCUMENTS, id));
    }

    @Override
    @Transactional(readOnly = true)
    public RichBodyState read(RichBodyOwner owner) {
        var content = richBodyRepository.findById(owner.id());
        var versions = richBodyRepository.findRevisionHeads(owner.id(), VERSIONS_SHOWN).stream()
                .map(revision -> new RichBodyState.BodyVersion(
                        revision.id(),
                        revision.reason(),
                        REASONS.getOrDefault(revision.reason(), revision.reason()),
                        revision.createdAt(),
                        null))
                .toList();
        var files =
                fileFacade.attachmentsOf(owner.type(), List.of(owner.id())).getOrDefault(owner.id(), List.of()).stream()
                        .collect(Collectors.toMap(AttachedFile::id, file -> owner.fileBase() + "/" + file.id()));
        var blocks = new LinkedHashMap<String, Long>();
        richBlockRepository.blocks(owner.id()).forEach(block -> blocks.put(block.id(), block.version()));
        return new RichBodyState(
                content.map(Content::version).orElse(0L),
                content.map(found -> object(found.body())).orElse(null),
                blocks,
                versions,
                files,
                RichBodyState.SCHEMA_VERSION);
    }

    @Override
    @Transactional(readOnly = true)
    public RichBodyState.BodyVersion version(RichBodyOwner owner, UUID revisionId) {
        var revision = richBodyRepository
                .findRevision(owner.id(), revisionId)
                .orElseThrow(RichBodyErrorCode.RICH_BODY_REVISION_NOT_FOUND::raise);
        return new RichBodyState.BodyVersion(
                revision.id(),
                revision.reason(),
                REASONS.getOrDefault(revision.reason(), revision.reason()),
                revision.createdAt(),
                object(revision.body()));
    }

    @Override
    @Transactional
    public RichBodyState save(RichBodyOwner owner, UUID actor, RichBodyEdit edit) {
        if (!"doc".equals(edit.body().get("type"))) throw RichBodyErrorCode.RICH_BODY_INVALID.raise();
        var current = richBodyRepository.findById(owner.id());
        long version = current.map(Content::version).orElse(0L);
        if (edit.expectedVersion() != version) throw RichBodyErrorCode.RICH_BODY_VERSION_CONFLICT.raise();
        commit(owner, actor, current, whole(owner, edit.body()), edit.uploadIds(), edit.checkpoint());
        return read(owner);
    }

    /**
     * Saves a body's changed blocks over the block versions read: a block changed elsewhere since refuses the save
     * (RICH_BODY_BLOCK_CONFLICT, nothing written); blocks changed elsewhere that this save does not touch stay, in the
     * order the save gives with blocks new elsewhere after the block they follow there.
     */
    @Override
    @Transactional
    public RichBodyState patch(RichBodyOwner owner, UUID actor, RichBodyPatch patch) {
        var current = richBodyRepository.findById(owner.id());
        var blocks = new LinkedHashMap<String, Block>();
        richBlockRepository.blocks(owner.id()).forEach(block -> blocks.put(block.id(), block));
        var nodes = new LinkedHashMap<String, String>();
        blocks.forEach((id, block) -> nodes.put(id, block.node()));
        var changed = new HashSet<String>();
        var conflicts = new TreeSet<String>();
        for (var put : patch.puts()) {
            if (put.blockId() == null
                    || put.blockId().isBlank()
                    || put.blockId().length() > BodyBlocks.ID_MAX
                    || put.node() == null
                    || !(put.node().get("type") instanceof String)) throw RichBodyErrorCode.RICH_BODY_INVALID.raise();
            String node = text(BodyBlocks.withId(RichBodyJson.present(put.node()), put.blockId()));
            var found = blocks.get(put.blockId());
            if (found != null && found.node().equals(node)) continue;
            if (found == null
                    ? put.expectedVersion() != null
                    : !Long.valueOf(found.version()).equals(put.expectedVersion())) {
                conflicts.add(put.blockId());
                continue;
            }
            nodes.put(put.blockId(), node);
            changed.add(put.blockId());
        }
        var deleted = new HashSet<String>();
        for (var delete : patch.deletes()) {
            var found = blocks.get(delete.blockId());
            if (found == null) continue;
            if (found.version() != delete.expectedVersion()) conflicts.add(delete.blockId());
            else deleted.add(delete.blockId());
        }
        if (!conflicts.isEmpty())
            throw RichBodyErrorCode.RICH_BODY_BLOCK_CONFLICT.raise(
                    "다른 곳에서 같은 블록이 먼저 바뀌었습니다: " + String.join(", ", conflicts));
        var order = mergedOrder(patch.order(), List.copyOf(blocks.keySet()), nodes.keySet(), deleted);
        nodes.keySet().removeIf(id -> !order.contains(id));
        String attrs = patch.attrs() == null
                ? richBlockRepository.attrs(owner.id())
                : patch.attrs().isEmpty() ? null : text(RichBodyJson.present(patch.attrs()));
        var plan = new Plan(order, nodes, changed, deleted, attrs);
        commit(owner, actor, current, plan, patch.uploadIds(), patch.checkpoint());
        return read(owner);
    }

    /**
     * The order a save of blocks ends with: the editor's order (blocks it knows), and each block it does not know (new
     * elsewhere since it read) right after the nearest block before it in the body as kept. Blocks the save deleted, or
     * deleted elsewhere and not written by this save, go.
     */
    static List<String> mergedOrder(List<String> given, List<String> kept, Set<String> known, Set<String> deleted) {
        var order = new ArrayList<String>();
        var seen = new HashSet<String>();
        for (String id : given) if (known.contains(id) && !deleted.contains(id) && seen.add(id)) order.add(id);
        for (int index = 0; index < kept.size(); index++) {
            String id = kept.get(index);
            if (seen.contains(id) || deleted.contains(id)) continue;
            int at = 0;
            for (int before = index - 1; before >= 0; before--) {
                int place = order.indexOf(kept.get(before));
                if (place >= 0) {
                    at = place + 1;
                    break;
                }
            }
            order.add(at, id);
            seen.add(id);
        }
        return order;
    }

    /** A whole body as the plan of its blocks against the blocks kept: blocks new or changed, and blocks gone. */
    private Plan whole(RichBodyOwner owner, Map<String, Object> body) {
        var split = BodyBlocks.split(body);
        var kept = new LinkedHashMap<String, String>();
        richBlockRepository.blocks(owner.id()).forEach(block -> kept.put(block.id(), block.node()));
        var order = new ArrayList<String>();
        var nodes = new LinkedHashMap<String, String>();
        var changed = new HashSet<String>();
        for (var block : split.blocks()) {
            String node = text(block.node());
            order.add(block.id());
            nodes.put(block.id(), node);
            if (!node.equals(kept.get(block.id()))) changed.add(block.id());
        }
        var deleted = new HashSet<>(kept.keySet());
        deleted.removeAll(nodes.keySet());
        return new Plan(order, nodes, changed, deleted, split.attrs() == null ? null : text(split.attrs()));
    }

    /** What one save does to a body's blocks: the order after it, every block's node, those written and those gone. */
    private record Plan(
            List<String> order, Map<String, String> nodes, Set<String> changed, Set<String> deleted, String attrs) {}

    /**
     * Writes a plan: the assembled body over the version kept (the body before its first change kept as a version), the
     * blocks written or moved at the new version, the blocks gone, their log and the root attributes, then the
     * checkpoint as a save of the body did before blocks.
     */
    private void commit(
            RichBodyOwner owner,
            UUID actor,
            Optional<Content> current,
            Plan plan,
            List<UUID> uploadIds,
            boolean checkpoint) {
        long version = current.map(Content::version).orElse(0L);
        String body = BodyBlocks.assemble(
                plan.attrs(), plan.order().stream().map(plan.nodes()::get).toList());
        if (body.length() > BODY_MAX) throw RichBodyErrorCode.RICH_BODY_INVALID.raise("본문이 너무 깁니다");
        requireFiles(owner, body, uploadIds);
        if (!uploadIds.isEmpty()) fileFacade.attach(actor, uploadIds, owner.type(), owner.id());
        Instant now = clock.instant();
        var next = new Content(owner.id(), owner.type(), body, version);
        boolean isChanged = current.map(found -> !found.body().equals(body)).orElse(true);
        if (isChanged) {
            // The body as it stood before its first change; one never written has nothing to keep.
            current.filter(found -> found.version() > 0 && !richBodyRepository.existsRevisionByOwnerId(owner.id()))
                    .ifPresent(found -> keep(found, "baseline", actor, now));
            if (!richBodyRepository.save(next, version, actor, now))
                throw RichBodyErrorCode.RICH_BODY_VERSION_CONFLICT.raise();
            writeBlocks(owner, actor, now, version + 1, plan);
            changed(owner, actor, now, version + 1);
        }
        if (checkpoint) {
            boolean kept = richBodyRepository.findRevisions(owner.id(), 1).stream()
                    .anyMatch(latest -> latest.body().equals(body));
            if (!kept && (isChanged || current.isPresent()))
                keep(next, "automatic", actor, now.plus(1, ChronoUnit.MICROS));
        }
    }

    /** The blocks of a plan at the body version it makes: new keys only for blocks new or moved, versions only for those written. */
    private void writeBlocks(RichBodyOwner owner, UUID actor, Instant now, long version, Plan plan) {
        var kept = new HashMap<String, Block>();
        richBlockRepository.blocks(owner.id()).forEach(block -> kept.put(block.id(), block));
        var keys = new HashMap<String, String>();
        kept.forEach((id, block) -> keys.put(id, block.position()));
        var assigned = BlockKeys.assign(plan.order(), keys);
        var written = new ArrayList<Block>();
        var log = new ArrayList<RichBlockRepository.Change>();
        for (String id : plan.order()) {
            var found = kept.get(id);
            boolean isWritten = found == null || plan.changed().contains(id);
            String key = assigned.get(id);
            if (!isWritten && key.equals(found.position())) continue;
            written.add(new Block(id, key, plan.nodes().get(id), isWritten ? version : found.version()));
            // A block only moved keeps its version but is logged, so a write over a run of blocks read before sees it
            // came.
            log.add(new RichBlockRepository.Change(id, plan.nodes().get(id)));
        }
        var gone = kept.keySet().stream()
                .filter(id -> !plan.nodes().containsKey(id))
                .toList();
        gone.forEach(id -> log.add(new RichBlockRepository.Change(id, null)));
        richBlockRepository.put(owner.id(), written, actor, now);
        richBlockRepository.delete(owner.id(), gone);
        richBlockRepository.log(owner.id(), version, log, actor, now);
        if (!Objects.equals(plan.attrs(), richBlockRepository.attrs(owner.id())))
            richBlockRepository.saveAttrs(owner.id(), plan.attrs());
    }

    @Override
    @Transactional
    public RichBodyState replace(RichBodyOwner owner, UUID actor, Map<String, Object> body, List<String> dropBlocks) {
        var current = read(owner);
        var files = withFiles(owner, actor, MarkdownReplacement.restore(body, current.body(), dropBlocks));
        if (current.body() != null)
            save(owner, actor, new RichBodyEdit(current.version(), current.body(), List.of(), true));
        return save(owner, actor, new RichBodyEdit(current.version(), files.body(), files.pendingIds(), true));
    }

    @Override
    @Transactional
    public RichBodyState replaceBlocks(
            RichBodyOwner owner,
            UUID actor,
            List<String> range,
            String after,
            Map<String, Object> replacement,
            List<String> dropBlocks,
            Long expectedVersion) {
        var current = read(owner);
        if (current.body() == null) throw RichBodyErrorCode.RICH_BODY_INVALID.raise("본문이 아직 없습니다");
        var blocks = BodyBlocks.split(current.body()).blocks();
        var order = new ArrayList<>(blocks.stream().map(BodyBlocks.Block::id).toList());
        int from = after == null ? 0 : order.indexOf(after) + 1;
        if ((after != null && from == 0)
                || from + range.size() > order.size()
                || !order.subList(from, from + range.size()).equals(range))
            throw RichBodyErrorCode.RICH_BODY_INVALID.raise("바꿀 블록이 본문에 차례대로 있지 않습니다");
        if (expectedVersion != null && expectedVersion != current.version()) {
            var touched = richBlockRepository.changedSince(owner.id(), expectedVersion).stream()
                    .filter(id -> range.contains(id) || !current.blocks().containsKey(id))
                    .sorted()
                    .toList();
            if (!touched.isEmpty())
                throw RichBodyErrorCode.RICH_BODY_BLOCK_CONFLICT.raise(
                        "본문이 그사이 바뀌었습니다 (이 부분의 블록 " + String.join(", ", touched) + "). 다시 읽고 고치세요.");
        }
        var old = blocks.subList(from, from + range.size());
        var oldDoc = Map.<String, Object>of(
                "type",
                "doc",
                "content",
                old.stream().map(BodyBlocks.Block::node).toList());
        var files = withFiles(owner, actor, MarkdownReplacement.restore(replacement, oldDoc, dropBlocks));
        // New blocks take the ids of the old ones of the same type in turn, so a paragraph rewritten stays that block.
        var used = new HashSet<String>(order.subList(0, from));
        used.addAll(order.subList(from + range.size(), order.size()));
        var puts = new ArrayList<RichBodyPatch.Put>();
        var ids = new ArrayList<String>();
        var nodes = BodyBlocks.split(files.body()).blocks();
        // Blocks kept by their marks keep their ids; the others may take the ids left.
        var restored =
                nodes.stream().map(BodyBlocks.Block::id).filter(range::contains).collect(Collectors.toSet());
        int reuse = 0;
        for (var node : nodes) {
            String id = restored.contains(node.id()) ? node.id() : null;
            while (id == null && reuse < old.size()) {
                var candidate = old.get(reuse++);
                if (!restored.contains(candidate.id())
                        && Objects.equals(
                                candidate.node().get("type"), node.node().get("type"))) id = candidate.id();
            }
            if (id == null || used.contains(id)) id = UUID.randomUUID().toString();
            used.add(id);
            ids.add(id);
            puts.add(new RichBodyPatch.Put(
                    id, BodyBlocks.withId(node.node(), id), current.blocks().get(id)));
        }
        var deletes = range.stream()
                .filter(id -> !ids.contains(id))
                .map(id -> new RichBodyPatch.Delete(id, current.blocks().get(id)))
                .toList();
        var nextOrder = new ArrayList<>(order.subList(0, from));
        nextOrder.addAll(ids);
        nextOrder.addAll(order.subList(from + range.size(), order.size()));
        // The body before is kept as a version, as a whole replacement keeps it.
        save(owner, actor, new RichBodyEdit(current.version(), current.body(), List.of(), true));
        return patch(owner, actor, new RichBodyPatch(nextOrder, puts, deletes, null, files.pendingIds(), true));
    }

    /** A body from Markdown with its media filled from the files it names, and those not yet the owner's (uploads). */
    private record Files(Map<String, Object> body, List<UUID> pendingIds) {}

    private Files withFiles(RichBodyOwner owner, UUID actor, Map<String, Object> next) {
        var named = new HashSet<UUID>();
        collectMediaIds(next, named);
        var known = new LinkedHashMap<UUID, AttachedFile>();
        fileFacade
                .attachmentsOf(owner.type(), List.of(owner.id()))
                .getOrDefault(owner.id(), List.of())
                .forEach(file -> known.put(file.id(), file));
        var pendingIds = named.stream().filter(id -> !known.containsKey(id)).toList();
        fileFacade.pendingOf(actor, pendingIds).forEach(file -> known.put(file.id(), file));
        if (!known.keySet().containsAll(named)) throw RichBodyErrorCode.RICH_BODY_FILE_UNKNOWN.raise();
        return new Files(hydrateMedia(next, known), pendingIds);
    }

    private static void collectMediaIds(Map<String, Object> node, Set<UUID> ids) {
        if ("media".equals(node.get("type"))) {
            String source = String.valueOf(MarkdownReplacement.attrs(node).get("src"));
            if (source.startsWith("attachment:")) {
                try {
                    ids.add(UUID.fromString(source.substring("attachment:".length())));
                } catch (IllegalArgumentException invalid) {
                    throw RichBodyErrorCode.RICH_BODY_FILE_UNKNOWN.raise();
                }
            }
        }
        MarkdownReplacement.children(node).forEach(child -> collectMediaIds(child, ids));
    }

    private static Map<String, Object> hydrateMedia(Map<String, Object> node, Map<UUID, AttachedFile> files) {
        var copy = new LinkedHashMap<>(node);
        if ("media".equals(node.get("type"))) {
            var attrs = new LinkedHashMap<>(MarkdownReplacement.attrs(node));
            String source = String.valueOf(attrs.get("src"));
            if (source.startsWith("attachment:")) {
                var file = files.get(UUID.fromString(source.substring("attachment:".length())));
                if (String.valueOf(attrs.getOrDefault("name", "")).isBlank()) attrs.put("name", file.filename());
                attrs.put("mime", file.contentType());
                attrs.put("size", file.size());
                if (file.dominantColor() != null) attrs.put("color", file.dominantColor());
                if (file.width() != null) attrs.put("pixelWidth", file.width());
                if (file.height() != null) attrs.put("pixelHeight", file.height());
                copy.put("attrs", attrs);
            }
        }
        if (node.containsKey("content"))
            copy.put(
                    "content",
                    MarkdownReplacement.children(node).stream()
                            .map(child -> hydrateMedia(child, files))
                            .toList());
        return copy;
    }

    @Override
    @Transactional
    public RichBodyState restore(RichBodyOwner owner, UUID actor, UUID revisionId, long expectedVersion) {
        var current = richBodyRepository
                .findById(owner.id())
                .orElseThrow(RichBodyErrorCode.RICH_BODY_REVISION_NOT_FOUND::raise);
        if (current.version() != expectedVersion) throw RichBodyErrorCode.RICH_BODY_VERSION_CONFLICT.raise();
        var old = richBodyRepository
                .findRevision(owner.id(), revisionId)
                .orElseThrow(RichBodyErrorCode.RICH_BODY_REVISION_NOT_FOUND::raise);
        Instant now = clock.instant();
        keep(current, "before-restore", actor, now);
        commit(owner, actor, Optional.of(current), whole(owner, object(old.body())), List.of(), false);
        var restored = richBodyRepository.findById(owner.id()).orElseThrow();
        keep(restored, "restored", actor, clock.instant().plus(1, ChronoUnit.MICROS));
        return read(owner);
    }

    // A pure conversion; the rule that a service's public methods declare their transaction holds it to a read.
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> fromMarkdown(String markdown) {
        return MarkdownBody.toDocument(markdown);
    }

    @Override
    @Transactional(readOnly = true)
    public String plainText(Map<String, Object> body) {
        var lines = new StringBuilder();
        writeText(body, lines);
        return lines.toString().strip();
    }

    /** A node's text, each text block (a paragraph, a heading, a code block) ending its line. */
    private static void writeText(Object node, StringBuilder lines) {
        if (!(node instanceof Map<?, ?> map)) return;
        if (map.get("text") instanceof String text) lines.append(text);
        if ("hardBreak".equals(map.get("type"))) lines.append('\n');
        if (map.get("content") instanceof List<?> children) for (Object child : children) writeText(child, lines);
        if (TEXT_BLOCKS.contains(String.valueOf(map.get("type")))
                && !lines.isEmpty()
                && lines.charAt(lines.length() - 1) != '\n') lines.append('\n');
    }

    /** The uploads must be named by the body, and every file it names must be the owner's or one of them. */
    private void requireFiles(RichBodyOwner owner, String body, List<UUID> uploadIds) {
        var known = new HashSet<>(uploadIds);
        for (UUID upload : uploadIds)
            if (!body.contains("attachment:" + upload)) throw RichBodyErrorCode.RICH_BODY_INVALID.raise();
        fileFacade.attachmentsOf(owner.type(), List.of(owner.id())).getOrDefault(owner.id(), List.of()).stream()
                .map(AttachedFile::id)
                .forEach(known::add);
        var named = FILE.matcher(body);
        while (named.find()) {
            UUID id;
            try {
                id = UUID.fromString(named.group(1));
            } catch (IllegalArgumentException invalid) {
                throw RichBodyErrorCode.RICH_BODY_FILE_UNKNOWN.raise();
            }
            if (!known.contains(id)) throw RichBodyErrorCode.RICH_BODY_FILE_UNKNOWN.raise();
        }
    }

    private void keep(Content content, String reason, UUID actor, Instant at) {
        richBodyRepository.saveRevision(
                new Revision(UUID.randomUUID(), content.ownerId(), content.body(), reason, at), actor);
    }

    /** The body changed by actor, to the given version: a line on the owner's timeline. */
    private void changed(RichBodyOwner owner, UUID actor, Instant at, long version) {
        activityFacade.record(
                new ActivityOwner(owner.type(), owner.id()),
                List.of(new ActivityEvent(BODY_EVENT, null, Long.toString(version), at, actor)));
    }

    private Map<String, Object> object(String json) {
        try {
            return jsonMapper.readValue(json, OBJECT);
        } catch (JacksonException unreadable) {
            throw new IllegalStateException("저장된 본문을 읽지 못했습니다", unreadable);
        }
    }

    private String text(Map<String, Object> object) {
        try {
            // Keys in order, so the same body is always the same text and an unchanged save is seen as one.
            return jsonMapper
                    .writer()
                    .with(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS)
                    .writeValueAsString(object);
        } catch (JacksonException unwritable) {
            throw RichBodyErrorCode.RICH_BODY_INVALID.raise();
        }
    }
}
