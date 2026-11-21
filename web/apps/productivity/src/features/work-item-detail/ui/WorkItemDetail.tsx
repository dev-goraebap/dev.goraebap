import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Suspense, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  changeComment, resolveComment, timelineOptions, workItemOptions, workItemPath, refreshWorkItems, type WorkItemRef, type WorkItemRow, type WorkItemView,
} from '@/entities/work-item';
import { canDeleteWorkItem, DeleteWorkItemDialog } from '@/entities/work-item';
import { isNotFound } from '@/shared/api';
import { sessionOptions } from '@/shared/auth';
import { stampText } from '@/shared/lib/date-stamp';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { ActionMenu, type MenuAction } from '@/shared/ui/kit/action-menu';
import { Alert, AlertAction, AlertTitle } from '@/shared/ui/kit/alert';
import { Button } from '@/shared/ui/kit/button';
import { CalendarIcon, ClockIcon, LinkIcon, Trash2Icon, TriangleAlertIcon, XIcon } from '@/shared/ui/kit/icon';
import { InfoPill } from '@/shared/ui/kit/info-pill';
import { PageState } from '@/shared/ui/kit/page-state';
import { PersonAvatar } from '@/shared/ui/person';
import { DetailLayout, type DetailSection } from '@/shared/ui/kit/reading';
import {
  BodyOutline, BodyOutlineProvider, BodyToolsContext, BodyVersions, RichBody, blockCommentsOf, serverBodyStore, useBodyHeadings, useRevealQuote,
  type BlockComments,
} from '@/shared/ui/rich-body';
import { Spinner } from '@/shared/ui/kit/spinner';
import { toast } from '@/shared/ui/kit/toast';
import { useWorkItemChange } from '../model/use-work-item-change';
import { useWorkItemSections } from './WorkItemProperties';
import { WorkItemTimeline } from './WorkItemTimeline';
import { CodeLinks } from './CodeLinks';
import { SubWorkItems } from './SubWorkItems';
import { useBodyToolPlaces } from './body-tool-places';
import { useProjectCan } from '@/entities/project';

/**
 * A work item opened, as client/'s (BIT's work item detail) on the detail page every body has (DetailLayout, Linear's
 * issue): its project and reference over its title, its parent, its sub-items, and its discussion and
 * activity; its properties as pills beside it on a wide page, between the title and the body on a narrow one. An archived project's work item is read only. Its maker or a Workspace administrator deletes
 * it from the …. hrefOf addresses the work items it links to (parent, children).
 */
export function WorkItemDetail({ projectKey, number, hrefOf, onDeleted, onEdit, headSlot }: {
  projectKey: string; number: number; hrefOf: (workItem: Pick<WorkItemRow, 'projectKey' | 'number' | 'ref'>) => string; onDeleted: () => void;
  /** 편집 단추가 여는 수정 화면. */
  onEdit?: () => void;
  /**
   * 이 상세를 품은 화면의 머리 줄 오른쪽 자리(페이지 머리 · 대화상자 머리): 본문의 도구(댓글 · 버전 기록 · 편집)와 메뉴(…)를
   * 다른 상세처럼 거기에 둔다. 없으면(자리를 주지 않는 화면) 소속 줄 끝에 둔다.
   */
  headSlot?: HTMLElement | null;
}) {
  const query = useQuery(workItemOptions(projectKey, number));
  if (query.isLoadingError) return isNotFound(query.error)
    ? <PageState kind="not-found" title="업무를 찾을 수 없습니다" description="지워졌거나 주소가 바뀌었을 수 있습니다." />
    : <PageState kind="error" title="업무를 불러오지 못했습니다" description={query.error.message}
      action={<Button variant="outline" onClick={() => void query.refetch()}>다시 시도</Button>} />;
  // 처음 읽는 동안은 빈 면으로 둔다(화면을 가리는 표시를 두지 않는다).
  if (!query.data) return <div aria-busy="true" aria-label="업무를 불러오는 중" className="min-h-0 flex-1 bg-background" />;
  return <BodyOutlineProvider><LoadedWorkItem view={query.data} hrefOf={hrefOf} onDeleted={onDeleted} onEdit={onEdit} headSlot={headSlot} /></BodyOutlineProvider>;
}

function LoadedWorkItem({ view, hrefOf, onDeleted, onEdit, headSlot }: {
  view: WorkItemView; hrefOf: (workItem: Pick<WorkItemRow, 'projectKey' | 'number' | 'ref'>) => string; onDeleted: () => void; onEdit?: () => void;
  headSlot?: HTMLElement | null;
}) {
  const client = useQueryClient();
  const session = useQuery(sessionOptions()).data;
  const workItem = view.issue;
  const canWrite = view.canWrite;
  const can = useProjectCan(view.issue.projectKey);
  const edit = useWorkItemChange(workItem);
  const sections = useWorkItemSections({ view, canEdit: canWrite, onChange: edit.change });
  const [isDeleting, setDeleting] = useState(false);
  const reveal = useRevealQuote();
  const places = useBodyToolPlaces();
  // 본문 블록의 댓글: 업무의 활동 기록에서 스레드를 만들고, 쓰고 나면 업무를 다시 읽는다.
  const timeline = useQuery(timelineOptions(workItem.projectKey, workItem.number));
  const comments = useMemo<BlockComments>(() => {
    const change = (value: Parameters<typeof changeComment>[2]) =>
      changeComment(workItem.projectKey, workItem.number, value).finally(() => refreshWorkItems(client));
    return blockCommentsOf(timeline.data ?? [], {
      meId: session?.id, canComment: can.comment, canModerate: can.manage,
      create: (blockId, quote, text) => change({ blockId, quote, text }),
      reply: (parentId, text) => change({ parentId, text }),
      edit: (commentId, text) => change({ commentId, text }),
      remove: commentId => change({ commentId, isDeleting: true }),
      resolve: (commentId, resolved) => resolveComment(workItem.projectKey, workItem.number, commentId, resolved).finally(() => refreshWorkItems(client)),
    });
  }, [timeline.data, session?.id, can.comment, can.manage, client, workItem.projectKey, workItem.number]);
  const author = session?.name ?? '나';
  const store = useMemo(() => serverBodyStore({ base: `${workItemPath(workItem.projectKey, workItem.number)}/body`, author, canWrite, client, readerId: session?.id }),
    [workItem.projectKey, workItem.number, author, canWrite, client, session?.id]);
  const canDelete = canDeleteWorkItem(view, session, can.manage);
  const copyLink = () => {
    const href = `${window.location.origin}${hrefOf(workItem)}`;
    void navigator.clipboard.writeText(href).then(() => toast.add({ title: '업무 주소를 복사했습니다.' }),
      () => toast.add({ type: 'error', title: '주소를 복사하지 못했습니다.' }));
  };
  // 페이지 메뉴: 업무의 동작, 그 뒤에 본문이 덧붙이는 것(휴대폰의 버전 기록).
  const actions: MenuAction[] = [
    { label: '주소 복사', icon: LinkIcon, onSelect: copyLink },
    ...(canDelete ? [{ label: '삭제', icon: Trash2Icon, onSelect: () => setDeleting(true) }] : []),
    ...places.menuActions,
  ];
  const parentOf = (parent: WorkItemRef) => ({ projectKey: workItem.projectKey, number: parent.number, ref: parent.ref });
  // 목차: 넓은 화면은 속성 칸의 한 묶음, 휴대폰은 오른쪽 아래 버튼(바텀시트). 제목이 없으면 두지 않는다.
  const headings = useBodyHeadings();
  const isPhone = useIsMobile();
  // 속성 칸: 목차(있으면, 맨 위) → 업무 속성 → 정보(작성자·작성일·수정일·버전, 본문 상세 공통).
  const info: DetailSection = {
    title: '정보', items: <>
      {view.createdByName ? <InfoPill label="작성자" icon={<PersonAvatar id={view.createdById ?? undefined} name={view.createdByName} size={16} isStatic />}>
        {view.createdByName}
      </InfoPill> : null}
      {workItem.createdAt ? <InfoPill label="작성일" icon={<CalendarIcon />}>{stampText(workItem.createdAt)}</InfoPill> : null}
      {workItem.updatedAt ? <InfoPill label="수정일" icon={<ClockIcon />}>{stampText(workItem.updatedAt)}</InfoPill> : null}
      <BodyVersions />
    </>,
  };
  const withOutline: DetailSection[] = [
    ...(!isPhone && headings.length ? [{ title: '목차', items: <BodyOutline /> }] : []),
    ...sections,
    info,
  ];
  const tools = <>
    <div ref={places.setSlot} className="flex shrink-0 items-center gap-1" />
    <ActionMenu isInline label="업무 메뉴" title={workItem.ref} actions={actions} />
  </>;
  return <BodyToolsContext value={places.tools}>
    {isPhone ? <BodyOutline /> : null}
    <DetailLayout label={`${workItem.ref} ${workItem.title}`} title={workItem.title} sections={withOutline}
      // 소속 줄: 프로젝트 · 번호(· 상위 업무). 본문의 도구(댓글 · 버전 기록 · 편집)와 …는 이 상세를 품은 화면의 머리 줄 오른쪽
      // (headSlot)에 둔다(다른 상세와 같은 규칙, 2026-11-15). 자리를 받지 못했을 때만 이 줄 끝에 그린다.
      head={<div className="flex min-w-0 items-center gap-2">
        <p className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
          {view.parent ? <>
            <Link to={hrefOf(parentOf(view.parent))} className="min-w-0 truncate underline-offset-4 hover:text-foreground hover:underline">
              {`${view.parent.ref} ${view.parent.title}`}
            </Link>
          </> : null}
        </p>
        {headSlot === undefined ? tools : headSlot ? createPortal(tools, headSlot) : null}
      </div>}
      after={<>
        <SubWorkItems workItem={workItem} items={view.children} canEdit={canWrite} hrefOf={hrefOf} />
        <CodeLinks projectKey={workItem.projectKey} number={workItem.number} />
        <WorkItemTimeline projectKey={workItem.projectKey} number={workItem.number} canComment={can.comment} canModerate={can.manage} onQuote={reveal} />
      </>}>
      {!canWrite ? <p className="text-sm text-muted-foreground">{can.comment ? '이 프로젝트의 뷰어라 읽고 댓글만 쓸 수 있습니다.' : '보관한 프로젝트의 업무라 읽기만 할 수 있습니다.'}</p> : null}
      {edit.error ? <Alert>
        <TriangleAlertIcon className="text-mark-high" />
        <AlertTitle className="whitespace-normal">{edit.error.message}</AlertTitle>
        <AlertAction>
          <Button variant="ghost" size="icon-sm" aria-label="닫기" onClick={() => edit.reset()}><XIcon /></Button>
        </AlertAction>
      </Alert> : null}
      <Suspense fallback={<div className="flex justify-center p-6"><Spinner aria-label="본문을 불러오는 중" /></div>}>
        <RichBody key={`${workItem.id}:${canWrite}`} store={store} canEdit={canWrite} title={workItem.title}
          comments={comments} onEdit={onEdit}
          historyHref={`/workspace/projects/${workItem.projectKey}/work-items/${workItem.number}/history`} />
      </Suspense>
    </DetailLayout>
    {places.foot}
    <DeleteWorkItemDialog workItem={workItem} isOpen={isDeleting} onClose={() => setDeleting(false)} onDeleted={onDeleted} />
  </BodyToolsContext>;
}
