# 조회 포트와 jOOQ 구현

화면 조회는 서비스와 같은 피처의 application에 둔 조회 포트로 하고, 구현은 infrastructure에 기술 이름을 붙여 둡니다. 규칙은 [조회 포트](../references/queries.md)에 있습니다.

## spring

출처: [server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/application/issue/IssueQuery.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/application/issue/IssueQuery.java)

```java
/** Issues as the screens read them; deleted issues and those of deleted projects are never shown. */
public interface IssueQuery {
    // …
    /** A slice of the issues matching the filter, in its order; rows carry no assignee name. */
    Slice findAll(Filter filter, String cursor, int size);
    // …
    /** One live issue's row, without the assignee's name. */
    Optional<IssueViews.IssueRow> findRow(UUID issueId);
    // …
    /**
     * What to list: projectIds (empty, every live project), the statuses by column or category, assigneeIds or none
     * (unassigned), labels, types and priorities (any of each), text, the children of one issue, and the order.
     */
    record Filter(
            List<UUID> projectIds,
            List<UUID> columnIds,
            // …
            IssueRequests.Sort sort,
            SortDirection direction) {
        public Filter {
            // …
        }
    }

    record Slice(List<IssueViews.IssueRow> rows, String nextCursor) {
        public Slice {
            rows = List.copyOf(rows);
        }
    }
}
```

`IssueQuery`는 `IssueService`와 같은 `application/issue`에 있습니다. 화면에 그대로 나가는 행은 `IssueViews.IssueRow`를 직접 돌려주고, 조건과 조각처럼 포트에만 필요한 타입은 포트 안에 불변 레코드로 중첩합니다. 하나를 읽는 조회는 없을 수 있음을 `Optional`로 계약에 드러냅니다.

출처: [server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/infrastructure/JooqIssueQuery.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/infrastructure/JooqIssueQuery.java)

```java
@Repository
@RequiredArgsConstructor
class JooqIssueQuery implements IssueQuery {
    // …
    private final DSLContext dslContext;
    // …
    @Override
    public Slice findAll(Filter filter, String cursor, int size) {
        var keys = keys(filter.sort());
        String sort = filter.direction().cursorName(filter.sort());
        var ordered = select().where(conditions(filter)).orderBy(order(keys, filter.direction()));
        var fetched = cursor == null
                ? ordered.limit(size + 1).fetch()
                : ordered.seek(Keyset.after(cursor, sort, keys)).limit(size + 1).fetch();
        var shown = fetched.size() > size ? fetched.subList(0, size) : fetched;
        String next = fetched.size() > size ? Keyset.next(sort, shown.getLast(), keys) : null;
        return new Slice(rows(shown), next);
    }
    // …
    @Override
    public Optional<IssueViews.IssueRow> findRow(UUID issueId) {
        var found = select().where(live().and(ISSUE.ISSUE_ID.eq(issueId))).fetch();
        return rows(found).stream().findFirst();
    }
    // …
}
```

출처: [server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/application/issue/IssueService.java](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/server/src/main/java/xyz/goraebap/cowork/module/workspace/issue/application/issue/IssueService.java)

```java
    private IssueViews.IssueView view(CurrentUser user, ProjectSummary project, UUID issueId) {
        var row = issueQuery.findRow(issueId).orElseThrow(IssueErrorCode.ISSUE_NOT_FOUND::raise);
        // …
    }
```

구현 `JooqIssueQuery`는 package-private 클래스입니다. 필터·정렬·페이지는 DB가 정하며, 한 줄 더 읽어 다음 조각이 있는지 보고 마지막 행의 정렬 값으로 커서를 만듭니다. 부재는 서비스가 `ISSUE_NOT_FOUND` 업무 오류로 바꿉니다.
