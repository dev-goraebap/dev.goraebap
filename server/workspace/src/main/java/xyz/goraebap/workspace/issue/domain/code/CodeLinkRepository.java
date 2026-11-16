package xyz.goraebap.workspace.issue.domain.code;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CodeLinkRepository {
    Optional<CodeLink> find(UUID integrationId, CodeLink.Kind kind, String externalId, UUID issueId);

    /** The work item's links, the latest moved last. */
    List<CodeLink> findAllByIssueId(UUID issueId);

    /** Inserts new links and writes over those seen again. */
    void saveAll(List<CodeLink> links);
}
