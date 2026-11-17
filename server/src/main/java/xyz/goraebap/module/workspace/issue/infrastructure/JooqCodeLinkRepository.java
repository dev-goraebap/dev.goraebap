package xyz.goraebap.module.workspace.issue.infrastructure;

import static xyz.goraebap.jooq.tables.CodeLink.CODE_LINK;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import xyz.goraebap.jooq.tables.records.CodeLinkRecord;
import xyz.goraebap.module.workspace.issue.domain.code.CodeLink;
import xyz.goraebap.module.workspace.issue.domain.code.CodeLinkRepository;

@Repository
@RequiredArgsConstructor
class JooqCodeLinkRepository implements CodeLinkRepository {
    private final DSLContext dslContext;

    @Override
    public Optional<CodeLink> find(UUID integrationId, CodeLink.Kind kind, String externalId, UUID issueId) {
        return dslContext
                .selectFrom(CODE_LINK)
                .where(CODE_LINK.INTEGRATION_ID.eq(integrationId))
                .and(CODE_LINK.KIND.eq(kind.name()))
                .and(CODE_LINK.EXTERNAL_ID.eq(externalId))
                .and(CODE_LINK.ISSUE_ID.eq(issueId))
                .fetchOptional(JooqCodeLinkRepository::link);
    }

    @Override
    public List<CodeLink> findAllByIssueId(UUID issueId) {
        return dslContext
                .selectFrom(CODE_LINK)
                .where(CODE_LINK.ISSUE_ID.eq(issueId))
                .orderBy(CODE_LINK.UPDATED_AT, CODE_LINK.CODE_LINK_ID)
                .fetch(JooqCodeLinkRepository::link);
    }

    @Override
    public void saveAll(List<CodeLink> links) {
        for (var link : links)
            dslContext
                    .insertInto(CODE_LINK)
                    .set(CODE_LINK.CODE_LINK_ID, link.id())
                    .set(CODE_LINK.INTEGRATION_ID, link.integrationId())
                    .set(CODE_LINK.ISSUE_ID, link.issueId())
                    .set(CODE_LINK.KIND, link.kind().name())
                    .set(CODE_LINK.EXTERNAL_ID, link.externalId())
                    .set(CODE_LINK.URL, link.url())
                    .set(CODE_LINK.TITLE, link.title())
                    .set(CODE_LINK.STATE, link.state().name())
                    .set(CODE_LINK.AUTHOR, link.author())
                    .set(CODE_LINK.DETAIL, link.detail())
                    .set(CODE_LINK.CREATED_AT, link.createdAt())
                    .set(CODE_LINK.UPDATED_AT, link.updatedAt())
                    .onConflict(CODE_LINK.CODE_LINK_ID)
                    .doUpdate()
                    .set(CODE_LINK.TITLE, link.title())
                    .set(CODE_LINK.STATE, link.state().name())
                    .set(CODE_LINK.AUTHOR, link.author())
                    .set(CODE_LINK.DETAIL, link.detail())
                    .set(CODE_LINK.UPDATED_AT, link.updatedAt())
                    .execute();
    }

    private static CodeLink link(CodeLinkRecord row) {
        return new CodeLink(
                row.getCodeLinkId(),
                row.getIntegrationId(),
                row.getIssueId(),
                CodeLink.Kind.valueOf(row.getKind()),
                row.getExternalId(),
                row.getUrl(),
                row.getTitle(),
                CodeLink.State.valueOf(row.getState()),
                row.getAuthor(),
                row.getDetail(),
                row.getCreatedAt(),
                row.getUpdatedAt());
    }
}
