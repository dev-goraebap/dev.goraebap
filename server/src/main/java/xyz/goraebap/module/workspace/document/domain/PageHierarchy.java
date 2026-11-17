package xyz.goraebap.module.workspace.document.domain;

import java.util.HashSet;
import java.util.Map;
import java.util.UUID;
import xyz.goraebap.shared.error.DomainRuleViolation;

public final class PageHierarchy {
    private PageHierarchy() {}

    public static void validateMove(UUID id, UUID parent, Map<UUID, UUID> parents) {
        var seen = new HashSet<UUID>();
        seen.add(id);
        var at = parent;
        while (at != null) {
            if (!seen.add(at)) throw new DomainRuleViolation("자신이나 하위 페이지 아래로 이동할 수 없습니다");
            if (seen.size() > 100) throw new DomainRuleViolation("페이지 깊이는 100단계까지입니다");
            at = parents.get(at);
        }
    }
}
