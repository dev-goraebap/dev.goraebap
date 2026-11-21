package xyz.goraebap.foundation.mcp.application;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import xyz.goraebap.foundation.mcp.McpArguments;
import xyz.goraebap.foundation.mcp.McpChangeSource;
import xyz.goraebap.foundation.mcp.McpTool;
import xyz.goraebap.foundation.mcp.McpToolProvider;
import xyz.goraebap.shared.web.CurrentUser;
import xyz.goraebap.shared.web.Cursor;

/**
 * changes_since: what changed across the modules that keep it (McpChangeSource: documents, issues) after an agent's
 * last cursor, so a session starts from what moved rather than from everything. The answer's cursor is the moment it
 * was read, to give next time.
 */
@Component
@RequiredArgsConstructor
public class ChangesMcpTools implements McpToolProvider {
    /** How far back a first call without since looks. */
    static final int DEFAULT_DAYS = 7;

    private final List<McpChangeSource> sources;
    private final Clock clock;

    @Override
    public List<McpTool> tools() {
        return List.of(McpTool.read(
                "changes_since",
                "바뀐 것 보기",
                "since(앞 응답의 cursor, ISO 시각 또는 YYYY-MM-DD) 뒤에 새로 생기거나 바뀐 문서와 이슈를 최근 순으로 돌려줍니다. since가 없으면 최근 7일. project로 한 프로젝트만. 세션을 시작할 때 이것부터 부르고, 응답의 cursor를 다음에 since로 주세요. 삭제는 식별자와 deletedAt만 돌려줍니다. 새 댓글이나 답글이 달린 문서는 commentedAt(그 구간의 마지막 댓글 시각)을 함께 주고, 본문·제목은 그대로이고 댓글만 달렸으면 change가 commented입니다. hasMore이면 cursor를 해석하지 말고 같은 project의 since로 계속 전달하세요. 마지막 cursor는 다음 동기화의 기준 시각입니다.",
                McpTool.input()
                        .string("since", "앞 응답의 cursor (ISO 시각) 또는 YYYY-MM-DD", false)
                        .string("project", "프로젝트 키 (공용 문서는 shared)", false)
                        .integer("size", "종류마다 볼 개수 (기본 50)", 1, 200),
                this::changes));
    }

    private Object changes(CurrentUser actor, McpArguments arguments) {
        var ordered = sources.stream()
                .sorted(Comparator.comparing(McpChangeSource::kind))
                .toList();
        String project = arguments.optionalString("project").orElse(null);
        String incoming = arguments.optionalString("since").orElse(null);
        Instant until = clock.instant();
        Instant since = until.minus(DEFAULT_DAYS, ChronoUnit.DAYS);
        var positions = new ArrayList<>(Collections.nCopies(ordered.size(), ""));
        if (incoming != null && incoming.startsWith("changes:")) {
            var values = Cursor.decode(incoming.substring(8), "mcp-changes-v1", 4 + ordered.size());
            if (!Objects.equals(values.get(2), project == null ? "" : project)
                    || !values.get(3).equals(actor.id().toString())) throw Cursor.invalid();
            since = moment(values.get(0));
            until = moment(values.get(1));
            for (int i = 0; i < ordered.size(); i++) positions.set(i, values.get(4 + i));
        } else if (incoming != null) since = moment(incoming);
        if (since.isAfter(until)) throw new IllegalArgumentException("since는 현재 시각보다 뒤일 수 없습니다.");
        int size = Math.clamp(arguments.integer("size", 50), 1, 200);
        var view = new LinkedHashMap<String, Object>();
        view.put("since", since);
        view.put("observedUntil", until);
        boolean more = false;
        for (int i = 0; i < ordered.size(); i++) {
            var source = ordered.get(i);
            if (positions.get(i).equals("-")) {
                view.put(source.kind(), List.of());
                continue;
            }
            var changes = source.changesSince(
                    actor, since, until, project, size, positions.get(i).isEmpty() ? null : positions.get(i));
            view.put(source.kind(), changes.items());
            positions.set(i, changes.nextCursor() == null ? "-" : changes.nextCursor());
            if (changes.nextCursor() != null) {
                more = true;
                view.put(source.kind() + "HasMore", true);
            }
        }
        if (more) {
            var values = new ArrayList<>(List.of(
                    since.toString(),
                    until.toString(),
                    project == null ? "" : project,
                    actor.id().toString()));
            values.addAll(positions);
            view.put("hasMore", true);
            view.put("cursor", "changes:" + Cursor.encode("mcp-changes-v1", values.toArray(String[]::new)));
        } else view.put("cursor", until);
        return view;
    }

    private static Instant moment(String text) {
        try {
            return Instant.parse(text);
        } catch (DateTimeParseException notInstant) {
            try {
                return LocalDate.parse(text).atStartOfDay(ZoneOffset.UTC).toInstant();
            } catch (DateTimeParseException notDay) {
                throw new IllegalArgumentException("since는 ISO 시각(앞 응답의 cursor)이나 YYYY-MM-DD여야 합니다.");
            }
        }
    }
}
