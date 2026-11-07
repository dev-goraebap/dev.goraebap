import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collections,
  kindLabels,
  plainText,
  useResourceApi,
} from "../../../entities/resource";
import type { ResourceKind } from "../../../entities/resource";
import {
  Button,
  CreationForm,
  DropdownMenu,
  Icon,
  ReferenceDialog,
  PageLayout,
  PageNotice,
  ConfirmDialog,
  RichTextBody,
} from "../../../shared/ui";
import { useResourceDraft } from "../model/resource-draft";
export function ResourceCreatePage({
  surface = "page",
  onClose,
  onExpand,
  onCreated,
}: {
  surface?: "dialog" | "page";
  onClose: () => void;
  onExpand?: () => void;
  onCreated: (id: string) => void;
}) {
  const [discard, setDiscard] = useState(false);
  const { draft, setDraft, reset } = useResourceDraft();
  const api = useResourceApi();
  const cache = useQueryClient();
  const [validUrl, hasUrl] = [isWebUrl(draft.url), draft.kind === "link"];
  const save = useMutation({
    mutationFn: () =>
      api.create({
        title: draft.title.trim(),
        body: draft.body ?? { type: "doc", content: [] },
        kind: draft.kind,
        collection: draft.collection,
        url: hasUrl ? draft.url.trim() : undefined,
        summary: plainText(draft.body).slice(0, 140),
      }),
    onSuccess: async (resource) => {
      cache.setQueryData(["resource", resource.id], resource);
      await cache.invalidateQueries({ queryKey: ["resources"] });
      reset();
      onCreated(resource.id);
    },
  });
  const close = () => {
    if (save.isPending) return;
    if (draft.title || plainText(draft.body)) {
      setDiscard(true);
      return;
    }
    reset();
    onClose();
  };
  const disabled =
    !draft.title.trim() ||
    !draft.collection ||
    (hasUrl && !validUrl) ||
    save.isPending;
  const actions = (
    <>
      <Button
        label="취소"
        variant="ghost"
        onClick={close}
        isDisabled={save.isPending}
      />
      <Button
        label="추가하기"
        variant="primary"
        isDisabled={disabled}
        isLoading={save.isPending}
        onClick={() => save.mutate()}
      />
    </>
  );
  const content = (
    <div
      className="library-compose"
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key === "Enter" &&
          !disabled
        ) {
          event.preventDefault();
          save.mutate();
        }
      }}
    >
      <CreationForm
        title={draft.title}
        onTitle={(title) => setDraft({ ...draft, title })}
        body={
          <div className="library-compose-body">
            <RichTextBody
              value={draft.body}
              onChange={(body) => setDraft({ ...draft, body })}
            />
            {hasUrl && (
              <input
                className="library-url-input"
                aria-label="원문 주소"
                type="url"
                placeholder="https:// 원문 주소"
                value={draft.url}
                onChange={(event) =>
                  setDraft({ ...draft, url: event.target.value })
                }
              />
            )}
          </div>
        }
        properties={
          <>
            <DropdownMenu
              button={{
                label: kindLabels[draft.kind],
                variant: "view",
                icon: <Icon name={draft.kind} />,
              }}
              items={(["document", "link", "image"] as ResourceKind[]).map(
                (kind) => ({
                  label: kindLabels[kind],
                  icon: <Icon name={kind} selected={draft.kind === kind} />,
                  selected: draft.kind === kind,
                  onClick: () => setDraft({ ...draft, kind }),
                }),
              )}
            />
            <DropdownMenu
              button={{
                label:
                  collections.find((item) => item.id === draft.collection)
                    ?.name ?? "컬렉션 · 필수",
                variant: "view",
                icon: <Icon name="folder" />,
              }}
              items={collections.map((item) => ({
                label: item.name,
                icon: (
                  <Icon name="folder" selected={draft.collection === item.id} />
                ),
                selected: draft.collection === item.id,
                onClick: () => setDraft({ ...draft, collection: item.id }),
              }))}
            />
          </>
        }
      />
    </div>
  );
  const confirmation = discard ? (
    <ConfirmDialog
      title="작성 중인 자료를 버릴까요?"
      cancelLabel="계속 작성"
      confirmLabel="버리기"
      isDestructive
      description="저장하지 않은 제목과 본문이 사라집니다."
      onCancel={() => setDiscard(false)}
      onConfirm={() => {
        setDiscard(false);
        reset();
        onClose();
      }}
    />
  ) : null;

  return (
    <>
      {surface === "dialog" ? (
        <ReferenceDialog
          isOpen
          title="자료 추가"
          notice={
            save.isError ? (
              <PageNotice>{save.error.message}</PageNotice>
            ) : undefined
          }
          width="48rem"
          onOpenChange={(open) => {
            if (!open) close();
          }}
          actions={
            onExpand ? (
              <Button
                label="페이지로 보기"
                isIconOnly
                variant="ghost"
                icon={<Icon name="expand" />}
                onClick={onExpand}
              />
            ) : undefined
          }
          footer={<div className="library-form-actions">{actions}</div>}
        >
          {content}
        </ReferenceDialog>
      ) : (
        <PageLayout
          title="자료 추가"
          notice={
            save.isError ? (
              <PageNotice>{save.error.message}</PageNotice>
            ) : undefined
          }
          isDetail
          onBack={close}
          footer={<footer className="library-form-footer">{actions}</footer>}
        >
          <div className="library-scroll">{content}</div>
        </PageLayout>
      )}
      {confirmation}
    </>
  );
}
function isWebUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
