import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  collectionName,
  formatDate,
  kindLabels,
  ResourcePreview,
  resourceQueries,
  useResourceApi,
} from "../../../entities/resource";
import type { Resource } from "../../../entities/resource";
import {
  Button,
  EmptyState,
  Icon,
  ReferenceDialog,
  PageLayout,
  PageNotice,
  DetailLayout,
} from "../../../shared/ui";

export function ResourceDetailPage({
  id,
  surface = "page",
  onClose,
  onExpand,
}: {
  id: string;
  surface?: "dialog" | "page";
  onClose: () => void;
  onExpand?: () => void;
}) {
  const api = useResourceApi();
  const query = useQuery(resourceQueries.detail(api, id));
  const cache = useQueryClient();
  const favorite = useMutation({
    mutationFn: (starred: boolean) => api.update(id, { starred }),
    onSuccess: (resource) => {
      cache.setQueryData(["resource", id], resource);
      void cache.invalidateQueries({ queryKey: ["resources"] });
    },
  });
  const actions = (
    <>
      {onExpand && (
        <Button
          label="페이지로 보기"
          isIconOnly
          icon={<Icon name="expand" />}
          variant="ghost"
          onClick={onExpand}
        />
      )}
      {query.data && (
        <Button
          label={query.data.starred ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          isIconOnly
          aria-pressed={query.data.starred}
          icon={<Icon name="star" selected={query.data.starred} />}
          variant="ghost"
          isLoading={favorite.isPending}
          onClick={() => favorite.mutate(!query.data!.starred)}
        />
      )}
    </>
  );
  const body = query.isPending ? (
    <div className="library-detail-loading" role="status">
      자료를 불러오는 중…
    </div>
  ) : query.isError ? (
    <EmptyState
      kind="error"
      title="자료를 열 수 없습니다"
      description={query.error.message}
      action="다시 시도"
      onAction={() => void query.refetch()}
    />
  ) : (
    <DetailContent resource={query.data} />
  );
  return surface === "dialog" ? (
    <ReferenceDialog
      isOpen
      title="자료"
      width="58rem"
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      actions={actions}
      notice={
        favorite.isError ? (
          <PageNotice>{favorite.error.message}</PageNotice>
        ) : undefined
      }
    >
      {body}
    </ReferenceDialog>
  ) : (
    <PageLayout
      title="자료"
      isDetail
      hasBodyHeading
      backLabel="자료 목록으로"
      onBack={onClose}
      actions={actions}
      notice={
        favorite.isError ? (
          <PageNotice>{favorite.error.message}</PageNotice>
        ) : undefined
      }
    >
      <div className="library-scroll">{body}</div>
    </PageLayout>
  );
}
function DetailContent({ resource }: { resource: Resource }) {
  const editor = useEditor(
    {
      extensions: [StarterKit],
      content: resource.body,
      editable: false,
      immediatelyRender: false,
    },
    [resource.id],
  );
  return (
    <div className="library-detail">
      <DetailLayout
        label="자료 상세"
        title={
          <>
            <div className="resource-kind">
              <Icon name={resource.kind} />
              {kindLabels[resource.kind]}
            </div>
            <h1>{resource.title}</h1>
          </>
        }
        sections={[
          {
            title: "속성",
            items: (
              <>
                <span className="library-property">
                  <Icon name="folder" />
                  {collectionName(resource.collection)}
                </span>
                <span className="library-property">
                  <span className="library-avatar">
                    {resource.author.slice(0, 1)}
                  </span>
                  {resource.author}
                </span>
                <span className="library-property">
                  <Icon name="calendar" />
                  {formatDate(resource.updatedAt)}
                </span>
              </>
            ),
          },
          ...(resource.url
            ? [
                {
                  title: "원문",
                  items: (
                    <a
                      className="library-source"
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon name="link" />
                      원문 보기
                      <Icon name="chevron" />
                    </a>
                  ),
                },
              ]
            : []),
        ]}
      >
        <ResourcePreview resource={resource} />
        <EditorContent className="library-rich-content" editor={editor} />
      </DetailLayout>
    </div>
  );
}
