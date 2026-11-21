import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Suspense, useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  bodyActivityOptions,
  changeBodyComment,
  documentBodyStore,
  resolveBodyComment,
  documentOptions,
  libraryOptions,
  useDeleteDocument,
  useMark,
} from '@/entities/document';
import { useProjectCan } from '@/entities/project';
import { sessionOptions } from '@/shared/auth';
import { stampText } from '@/shared/lib/date-stamp';
import { useOpenEditor } from '@/shared/lib/panel';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { ActionMenu, type MenuAction } from '@/shared/ui/kit/action-menu';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import {
  CalendarIcon, ClockIcon, DownloadIcon, FolderIcon, GripIcon, LockIcon, PaletteIcon, SettingsIcon, TagIcon, Trash2Icon,
} from '@/shared/ui/kit/icon';
import { InfoPill } from '@/shared/ui/kit/info-pill';
import { DetailSurface } from '@/shared/ui/kit/detail-surface';
import { PageState } from '@/shared/ui/kit/page-state';
import { PersonAvatar } from '@/shared/ui/person';
import { DetailLayout, type DetailSection } from '@/shared/ui/kit/reading';
import {
  BodyOutline, BodyOutlineProvider, BodyToolsContext, BodyVersions, RichBody, blockCommentsOf, useBodyHeadings, useRevealQuote, type BlockComments,
} from '@/shared/ui/rich-body';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { BodyActivity } from './BodyActivity';
import { usePageTools, type Crumb } from '../model/page-tools';
import { AccessDialog } from './AccessDialog';
import { DocumentMarkDialog } from './DocumentMarkDialog';
import { PdfExportDialog } from './PdfExportDialog';

type Dialog = 'mark' | 'access' | 'delete' | 'pdf' | null;
export function DocumentReader({
  id,
  projectKey,
  crumbs,
  onLabels,
  onContents,
  onMove,
  onManagePages,
  children,
  readingNavigation,
  onDeleted,
  created,
}: {
  id: string;
  projectKey: string;
  crumbs: Crumb[];
  onLabels: () => void;
  onContents?: () => void;
  onMove?: () => void;
  /** 이 문서의 페이지 관리(순서·생성·이름·이동·삭제). 하위 페이지가 없어 사이드바 톱니가 없을 때도 여기서 첫 페이지를 만든다. */
  onManagePages?: () => void;
  children?: ReactNode;
  readingNavigation?: ReactNode;
  onDeleted?: () => void;
  /** 문서함 목록이 아는 작성 정보(문서 보기 응답에는 작성일·작성자 이름이 없다). */
  created?: { createdAt?: string; createdByName?: string };
}) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const session = useQuery(sessionOptions()).data;
  const view = useQuery(documentOptions(id));
  const doc = view.data?.document;
  const canWrite = !!view.data?.canWrite;
  // 댓글은 뷰어도 쓴다(보관한 프로젝트는 아무도). 남의 댓글 지우기는 그 프로젝트의 관리자.
  const can = useProjectCan(projectKey);
  const [dialog, setDialog] = useState<Dialog>(null);
  // 내보내기 대화상자의 기본값(표지·문서 목차)은 하위 페이지가 있는지로 정한다. 사이드바가 이미 읽은 문서함을 쓴다.
  const library = useQuery({ ...libraryOptions(projectKey), enabled: dialog === 'pdf' });
  const closePdf = useCallback(() => setDialog(null), []);
  const openEditor = useOpenEditor();
  const mark = useMark(() => setDialog(null));
  const remove = useDeleteDocument(() => onDeleted ? onDeleted() : navigate({ href: `/workspace/projects/${projectKey}/documents` }));
  const page = usePageTools();
  const store = useMemo(
    () =>
      documentBodyStore({
        id,
        author: session?.name ?? '나',
        canWrite,
        client,
        readerId: session?.id,
      }),
    [id, session?.name, session?.id, canWrite, client],
  );
  const reveal = useRevealQuote();
  // 본문 블록의 댓글: 문서의 활동 기록에서 스레드를 만들고, 쓰고 나면 활동을 다시 읽는다.
  const activityKey = bodyActivityOptions('documents', id).queryKey;
  const activity = useQuery(bodyActivityOptions('documents', id));
  const comments = useMemo<BlockComments>(() => {
    const refresh = () => client.invalidateQueries({ queryKey: activityKey });
    const change = (value: Parameters<typeof changeBodyComment>[2]) => changeBodyComment('documents', id, value).finally(refresh);
    return blockCommentsOf(activity.data ?? [], {
      meId: session?.id, canComment: can.comment, canModerate: can.manage,
      create: (blockId, quote, text) => change({ blockId, quote, text }),
      reply: (parentId, text) => change({ parentId, text }),
      edit: (commentId, text) => change({ commentId, text }),
      remove: commentId => change({ commentId, isDeleting: true }),
      resolve: (commentId, resolved) => resolveBodyComment('documents', id, commentId, resolved).finally(refresh),
    });
    // activityKey는 id에서 나온다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.data, session?.id, can.comment, can.manage, client, id]);
  const actions: MenuAction[] = doc
    ? [
        ...(onContents ? [{ label: '목차', icon: GripIcon, onSelect: onContents }] : []),
        ...(onManagePages ? [{ label: '페이지 관리', icon: SettingsIcon, onSelect: onManagePages }] : []),
        { label: 'PDF로 내보내기', icon: DownloadIcon, onSelect: () => setDialog('pdf') },
        ...(canWrite
          ? [
              ...(!doc.parentId ? [{ label: '문서 라벨', icon: TagIcon, onSelect: onLabels }] : []),
              ...(onMove ? [{ label: '페이지 이동', icon: FolderIcon, onSelect: onMove }] : []),
              { label: '표식 바꾸기', icon: PaletteIcon, onSelect: () => setDialog('mark') },
            ]
          : []),
        { label: '권한', icon: LockIcon, onSelect: () => setDialog('access') },
        ...(view.data?.canDelete ? [{ label: '삭제', icon: Trash2Icon, onSelect: () => setDialog('delete') }] : []),
        // 본문이 덧붙인 항목(휴대폰의 버전 기록)은 끝에 둔다.
        ...page.extras,
      ]
    : [];
  return (
    <BodyToolsContext value={page.tools}>
      {/* 다른 상세와 같은 틀(2026-11-15): 데스크톱은 둥근 ← 뒤로(문서 목록으로), 휴대폰은 앱 바. */}
      <DetailSurface
        surface="page"
        title={doc?.title ?? '문서'}
        crumbs={pageCrumbs([...crumbs.slice(0, -1), ...crumbs.slice(-1).map(each => ({ ...each, href: each.href ?? `/workspace/projects/${projectKey}/documents` })), { label: doc?.title ?? '문서' }])}
        actions={<div className="flex shrink-0 items-center gap-1">
          {/* 본문의 도구(댓글 · 버전 기록 · 편집)가 이 칸에 선다. */}
          <div ref={page.setSlot} className="flex items-center gap-1.5 empty:hidden" />
          {actions.length ? <ActionMenu isInline label="문서 메뉴" title={doc?.title ?? '문서'} actions={actions} /> : null}
        </div>}
      >
        {view.isError ? (
          <PageState kind="not-found" title="문서를 찾을 수 없습니다" description={view.error.message} />
        ) : doc && doc.projectKey?.toUpperCase() === projectKey.toUpperCase() ? (
          <BodyOutlineProvider>
            <DocumentFrame label={doc.title} title={doc.title}
              info={infoSection({ author: { id: doc.createdById, name: created?.createdByName }, createdAt: created?.createdAt,
                updatedAt: doc.updatedAt, updatedBy: doc.updatedByName })}
              after={<>
                <BodyActivity target="documents" id={id} canWrite={can.comment} canModerate={can.manage} onQuote={reveal} />
                {readingNavigation}
              </>}>
              <Suspense fallback={<p className="text-muted-foreground">본문을 불러오는 중…</p>}>
                <RichBody
                  key={`${id}:${canWrite}`}
                  store={store}
                  title={doc.title}
                  canEdit={canWrite}
                  onEdit={() => openEditor(`/workspace/projects/${projectKey}/documents/${id}/edit`)}
                  comments={comments}
                  historyHref={`/workspace/projects/${projectKey}/documents/${id}/history`}
                />
              </Suspense>
              {children}
            </DocumentFrame>
          </BodyOutlineProvider>
        ) : doc ? (
          <PageState kind="not-found" title="이 프로젝트의 문서가 아닙니다" />
        ) : null}
        {dialog === 'pdf' && doc && (library.data || library.isError) ? (
          <PdfExportDialog documentId={doc.id} name={doc.title} hasPages={!!library.data?.pages.some(each => each.parentId === doc.id)}
            onClose={closePdf} />
        ) : null}
        {dialog === 'mark' && doc ? (
          <DocumentMarkDialog
            name={doc.title}
            value={{ icon: doc.icon ?? null, color: doc.color ?? null }}
            isPending={mark.isPending}
            onClose={() => setDialog(null)}
            onSave={(next) => mark.mutate({ document: doc, mark: next })}
          />
        ) : null}
        {dialog === 'access' && doc ? (
          <AccessDialog target="documents" id={id} name={doc.title} onClose={() => setDialog(null)} />
        ) : null}
        <ConfirmDialog
          open={dialog === 'delete'}
          onOpenChange={(open) => { if (!open) setDialog(null); }}
          title="문서를 삭제할까요?"
          description={remove.error?.message ?? '이 페이지와 그 아래의 하위 페이지를 함께 삭제합니다.'}
          action={{ label: '삭제', isPending: remove.isPending, onAction: () => { if (doc) remove.mutate({ document: doc }); } }}
        />
      </DetailSurface>
    </BodyToolsContext>
  );
}

/**
 * 본문을 가진 상세가 같은 자리 · 같은 순서로 두는 '정보' 묶음: 작성자(아바타), 작성일, 수정일(고친 사람), 버전. 모르는 값은 줄째 뺀다.
 * 시각은 표와 같은 회사 시계의 yyyy-mm-dd HH:mm(stampText).
 */
function infoSection({ author, createdAt, updatedAt, updatedBy }: {
  author?: { id?: string | null; name?: string | null }; createdAt?: string | null; updatedAt?: string | null; updatedBy?: string | null;
}): DetailSection {
  const sameEditor = !updatedBy || updatedBy === author?.name;
  return {
    title: '정보',
    items: <>
      {author?.name ? <InfoPill label="작성자" icon={<PersonAvatar id={author.id ?? undefined} name={author.name} size={16} isStatic />}>{author.name}</InfoPill> : null}
      {createdAt ? <InfoPill label="작성일" icon={<CalendarIcon />}>{stampText(createdAt)}</InfoPill> : null}
      {updatedAt ? <InfoPill label="수정일" icon={<ClockIcon />}>{`${stampText(updatedAt)}${sameEditor ? '' : ` · ${updatedBy}`}`}</InfoPill> : null}
      <BodyVersions />
    </>,
  };
}

/**
 * 문서 상세의 틀: 다른 본문 상세(업무·회의록·공지·일정·주간보고)와 같은 DetailLayout. 속성 칸은 목차(제목이 있으면,
 * 맨 위)와 정보(작성자·작성일·수정일·버전)다. 휴대폰의 목차는 오른쪽 아래 버튼(바텀시트)이다.
 */
function DocumentFrame({ label, title, info, after, children }: { label: string; title: string; info: DetailSection; after: ReactNode; children: ReactNode }) {
  const headings = useBodyHeadings();
  const isPhone = useIsMobile();
  const sections = [...(!isPhone && headings.length ? [{ title: '목차', items: <BodyOutline /> }] : []), info];
  return <>
    {isPhone ? <BodyOutline /> : null}
    <DetailLayout label={label} title={title} sections={sections} after={after}>{children}</DetailLayout>
  </>;
}
