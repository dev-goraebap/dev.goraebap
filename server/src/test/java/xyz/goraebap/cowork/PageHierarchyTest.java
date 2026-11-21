package xyz.goraebap.cowork;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import xyz.goraebap.cowork.module.workspace.document.domain.PageHierarchy;
import xyz.goraebap.cowork.shared.error.DomainRuleViolation;

class PageHierarchyTest {
    @Test
    void rejectsMovingABranchUnderItselfOrItsDescendants() {
        var root = UUID.randomUUID();
        var section = UUID.randomUUID();
        var child = UUID.randomUUID();
        var tree = Map.of(section, root, child, section);
        assertThatThrownBy(() -> PageHierarchy.validateMove(root, child, tree)).isInstanceOf(DomainRuleViolation.class);
        assertThatThrownBy(() -> PageHierarchy.validateMove(root, root, tree)).isInstanceOf(DomainRuleViolation.class);
        assertThatCode(() -> PageHierarchy.validateMove(child, root, tree)).doesNotThrowAnyException();
        assertThatCode(() -> PageHierarchy.validateMove(section, null, tree)).doesNotThrowAnyException();
    }
}
