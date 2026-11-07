import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  collectionName,
  formatDate,
  kindLabels,
  ResourcePreview,
  resourceQueries,
  useResourceApi,
} from "../../../entities/resource";
import type { Resource, ResourceKind } from "../../../entities/resource";
import {
  Button,
  DropdownMenu,
  EmptyState,
  Icon,
  SearchTool,
  PageLayout,
  PageNotice,
  useToolSize,
} from "../../../shared/ui";
import { validateLibrarySearch } from "../model/library-search";
export function LibraryPage({
  onOpen,
  onCreate,
}: {
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const toolSize = useToolSize();
  const location = useLocation();
  const navigate = useNavigate();
  const search = validateLibrarySearch(location.search);
  const query = useQuery(resourceQueries.all(useResourceApi()));
  const change = (patch: Partial<typeof search>, replace = false) =>
    void navigate({
      to: location.pathname,
      search: { ...search, ...patch },
      replace,
    });
  const items = (query.data ?? [])
    .filter(
      (item) =>
        (!search.collection || item.collection === search.collection) &&
        (!search.starred || item.starred) &&
        (!search.author || item.author === search.author) &&
        (search.kind === "all" || item.kind === search.kind) &&
        `${item.title} ${item.summary}`
          .toLocaleLowerCase()
          .includes(search.q.toLocaleLowerCase()),
    )
    .sort((a, b) =>
      search.sort === "title"
        ? a.title.localeCompare(b.title, "ko")
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  const title = search.collection
    ? collectionName(search.collection)
    : search.starred
      ? "즐겨찾기"
      : "모든 자료";
  const authors = [...new Set(query.data?.map((item) => item.author))];
  const filtered = !!search.q || !!search.author || search.kind !== "all";
  return (
    <PageLayout
      title={title}
      icon={<Icon name={search.collection ? "folder" : "library"} />}
      create={{ label: "자료 추가", onClick: onCreate }}
      notice={
        query.isError && query.data ? (
          <PageNotice onRetry={() => void query.refetch()}>
            자료를 새로 불러오지 못했습니다. 기존 자료를 보여드립니다.
          </PageNotice>
        ) : undefined
      }
      toolbar={
        <div className="library-toolbar">
          <div
            className="library-view-tabs"
            role="group"
            aria-label="자료 종류"
          >
            {(["all", "document", "link", "image"] as const).map((kind) => (
              <Button
                key={kind}
                size={toolSize}
                label={kind === "all" ? "전체" : kindLabels[kind]}
                icon={
                  <Icon
                    name={kind === "all" ? "library" : kind}
                    selected={search.kind === kind}
                  />
                }
                variant={search.kind === kind ? "view-active" : "view"}
                aria-pressed={search.kind === kind}
                onClick={() => change({ kind })}
              />
            ))}
          </div>
          <div className="library-toolbar-actions">
            <SearchTool
              inputLabel="자료 검색"
              placeholder="자료 검색…"
              value={search.q}
              onChange={(q) => change({ q }, true)}
            />
            <DropdownMenu
              active={!!search.author}
              button={{
                label: "필터",
                isIconOnly: true,
                icon: <Icon name="filter" selected={!!search.author} />,
              }}
              hasChevron={false}
              items={[
                {
                  label: "전체 작성자",
                  icon: <Icon name="person" />,
                  selected: !search.author,
                  onClick: () => change({ author: undefined }),
                },
                ...authors.map((author) => ({
                  label: author,
                  icon: (
                    <Icon name="person" selected={search.author === author} />
                  ),
                  selected: search.author === author,
                  onClick: () => change({ author }),
                })),
              ]}
            />
            <DropdownMenu
              active={search.sort !== "updated" || search.view !== "grid"}
              button={{
                label: "표시",
                isIconOnly: true,
                icon: (
                  <Icon
                    name="sort"
                    selected={
                      search.sort !== "updated" || search.view !== "grid"
                    }
                  />
                ),
              }}
              hasChevron={false}
              items={[
                {
                  label: "그리드 보기",
                  group: "보기",
                  icon: <Icon name="grid" />,
                  selected: search.view === "grid",
                  onClick: () => change({ view: "grid" }),
                },
                {
                  label: "리스트 보기",
                  group: "보기",
                  icon: <Icon name="list" />,
                  selected: search.view === "list",
                  onClick: () => change({ view: "list" }),
                },
                {
                  label: "최근 수정순",
                  group: "정렬",
                  icon: <Icon name="calendar" />,
                  selected: search.sort === "updated",
                  onClick: () => change({ sort: "updated" }),
                },
                {
                  label: "이름순",
                  group: "정렬",
                  icon: <Icon name="sort" />,
                  selected: search.sort === "title",
                  onClick: () => change({ sort: "title" }),
                },
                {
                  label: "기본 표시로 초기화",
                  icon: <Icon name="reset" />,
                  onClick: () => change({ sort: "updated", view: "grid" }),
                },
              ]}
            />
          </div>
        </div>
      }
      applied={
        search.author ? (
          <div className="library-applied">
            <span className="library-filter-chip">
              <Icon name="person" />
              <span>작성자</span>
              <strong>{search.author}</strong>
              <Button
                label="작성자 필터 해제"
                variant="ghost"
                isIconOnly
                icon={<Icon name="x" />}
                onClick={() => change({ author: undefined })}
              />
            </span>
            <Button
              label="모두 지우기"
              variant="ghost"
              onClick={() => change({ author: undefined })}
            />
          </div>
        ) : undefined
      }
    >
      <div className="library-scroll">
        {query.isPending ? (
          <div
            className={
              search.view === "list"
                ? "library-list-skeleton"
                : "library-grid library-skeleton"
            }
            role="status"
            aria-label="자료 불러오는 중"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} />
            ))}
          </div>
        ) : query.isError && !query.data ? (
          <EmptyState
            kind="error"
            title="자료를 불러오지 못했습니다"
            description={query.error.message}
            action="다시 시도"
            onAction={() => void query.refetch()}
          />
        ) : !items.length ? (
          <EmptyState
            kind={filtered ? "search" : "empty"}
            title={
              filtered
                ? "조건에 맞는 자료가 없습니다"
                : "아직 담아둔 자료가 없습니다"
            }
            description={
              filtered
                ? "검색어나 필터를 바꿔보세요."
                : "다시 보고 싶은 링크와 문서를 모아보세요."
            }
            action={filtered ? "조건 초기화" : "자료 추가"}
            onAction={() =>
              filtered
                ? change({ q: "", kind: "all", author: undefined })
                : onCreate()
            }
          />
        ) : (
          <>
            <div className="library-section-heading">
              <span>
                {search.kind === "all"
                  ? "자료"
                  : kindLabels[search.kind as ResourceKind]}
              </span>
              <span>{items.length}개</span>
            </div>
            <div
              className={
                search.view === "grid" ? "library-grid" : "library-list"
              }
            >
              {items.map((item) => (
                <ResourceItem
                  key={item.id}
                  resource={item}
                  view={search.view}
                  onOpen={onOpen}
                  onCollection={(collection) => change({ collection })}
                />
              ))}
            </div>
            <footer className="library-list-footer">
              자료 {items.length}개
            </footer>
          </>
        )}
      </div>
    </PageLayout>
  );
}
function ResourceItem({
  resource,
  view,
  onOpen,
  onCollection,
}: {
  resource: Resource;
  view: "grid" | "list";
  onOpen: (id: string) => void;
  onCollection: (id: string) => void;
}) {
  return (
    <article className={`resource-item resource-item--${view}`}>
      <div className="resource-open">
        <ResourcePreview resource={resource} compact={view === "list"} />
        <div className="resource-copy">
          <span className="resource-kind">
            <Icon name={resource.kind} size={14} />
            {kindLabels[resource.kind]}
          </span>
          <h2>
            <a
              className="resource-title"
              href={`/resources/${resource.id}`}
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                onOpen(resource.id);
              }}
            >
              {resource.title}
            </a>
          </h2>
          <p>{resource.summary}</p>
        </div>
      </div>
      <div className="resource-meta">
        <button
          className="library-inline-link"
          onClick={() => onCollection(resource.collection)}
        >
          <Icon name="folder" size={14} />
          {collectionName(resource.collection)}
        </button>
        <span>
          <Icon name="calendar" size={14} />
          {formatDate(resource.updatedAt)}
        </span>
      </div>
    </article>
  );
}
