import { ApiError } from '@/shared/api';
import { useBodyPresence } from './use-body-presence';
import {
  RichDocument, VersionHistoryDialog,
  type DocumentFont, type JSONNode,
} from '@/shared/lib/rich-document';
import { useEffect, useRef, useState, type MouseEvent, type ReactElement } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { LinkChoice } from '@/shared/lib/rich-document';
import { createPortal } from 'react-dom';
import type { MenuAction } from '@/shared/ui/kit/action-menu';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { CommentIcon, PenSquareIcon, RestoreIcon } from '@/shared/ui/kit/icon';
import { Spinner } from '@/shared/ui/kit/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/kit/tooltip';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { useMaskedDialog } from '@/shared/lib/panel';
import { useBodyEditContext } from './body-edit';
import { BodyBanner, useBodyTools } from './body-tools';
import { headingsOf, usePublishHeadings, usePublishVersions } from './outline-context';
import { blockCommentBox, type BlockComments } from './block-comments';
import { BlockCommentLayer } from './BlockCommentLayer';
import { useRichBody, type RichBodyStatus, type RichBodyStore } from './use-rich-body';
import { useSerifBody } from '@/shared/lib/appearance';
import { PagedBody, usePagedBody, type PagedPrint } from './paged-body';

/** 툴팁을 단 단추(키트 Tooltip). 단축키 · 설명처럼 이름 밖의 말을 보인다. */
function Tip({ tip, children }: { tip: string; children: ReactElement }) {
  return <Tooltip><TooltipTrigger render={children} /><TooltipContent>{tip}</TooltipContent></Tooltip>;
}
/** 저장 중처럼 일하는 동안의 단추 표시. */
const busy = (isBusy: boolean) => isBusy ? <Spinner data-icon="inline-start" /> : null;

const statusText: Partial<Record<RichBodyStatus, string>> = { unsaved: '저장 안 됨', saving: '저장 중…', saved: '저장됨', failed: '저장하지 못함', conflict: '저장하지 못함' };

/**
 * A body read first and written on demand (cowork-guide-design-system, 본문 뷰어/에디터), as client/'s: it opens in reading,
 * and 편집 switches to editing in the same editor (its Undo kept). Nothing saves on its own (명시 저장): 저장 or Ctrl+S (⌘S)
 * saves while editing, and 편집 완료 saves and goes back; each save is kept as a version (useRichBody). Inside a detail's
 * editing (BodyEditContext) the title opens and saves with it. Its tools stand at the end of its page's head (DESIGN.md
 * 상세 페이지; BodyToolsContext): 댓글 · 버전 기록 · 편집, while editing what is saved, 저장 and 편집 완료; a phone keeps
 * 편집 (저장 · 완료) there and puts a phone's 기록 in the page's menu.
 * Outside a page they stand at the body's head. A conflict or a
 * failure keeps the draft and says so above the body (BodyBanner), with the ways on.
 *
 * When the domain keeps them (the store's history), 버전 기록 lists the kept versions; one picked shows read-only in the
 * body's place (the draft and its editor kept out of sight), compares with the body now, and restores as a new version.
 * title names the body in the comparison. The discussion is the owner's 활동, not the body's (결정기록 2026-11-04 공통
 * 활동). Comments sit on the body's blocks (2026-11-11 사용자 결정): while reading, 댓글 in the head turns the pointer into
 * a box over a block, and a block picked opens its thread there (comments, BlockCommentLayer).
 */
export function RichBody({ store, canEdit = true, title = '', comments, onEdit, links, print, historyHref }: {
  /** PDF 인쇄 화면: 정한 쪽 설정으로 늘 페이지로 나누고 쪽 번호를 이어 매긴다(읽기 전용). */
  print?: PagedPrint;
  store: RichBodyStore; canEdit?: boolean; title?: string;
  /** 링크 입력 칸에서 이름으로 찾아 걸 수 있는 문서들(같은 프로젝트의 문서). */
  links?: LinkChoice[];
  /** 읽는 화면(상세): 편집 단추가 본문을 제자리에서 열지 않고 이 길(수정 화면)로 간다. */
  onEdit?: () => void;
  /** 버전 기록 페이지의 주소(…/history; 버전 하나는 그 아래 /{버전}). 없으면 버전 기록을 두지 않는다. */
  historyHref?: string;
  /** The comments on the body's blocks (the owner's 활동); without it the body shows none and takes none. */
  comments?: BlockComments;
}) {
  const scope = useBodyEditContext();
  const body = useRichBody(store, () => !!scope?.isTitleChanged);
  const page = useBodyTools();
  // 본문의 제목들을 상세 화면의 목차(BodyOutline)에 알린다: 읽어 온 본문, 그리고 고치는 동안의 글.
  const publishHeadings = usePublishHeadings();
  useEffect(() => { publishHeadings?.(headingsOf(body.value)); }, [body.value, publishHeadings]);
  const publishVersions = usePublishVersions();
  useEffect(() => { publishVersions?.(store.history ? body.versions.length : 0); }, [body.versions.length, store.history, publishVersions]);
  const isPhone = useIsMobile();
  const [isEditingAsked, setEditingAsked] = useState(false);
  const [ownMode, setOwnMode] = useState<'read' | 'edit'>('read');
  const mode = scope ? (scope.isEditing ? 'edit' : 'read') : ownMode;
  const setMode = (next: 'read' | 'edit') => { if (scope) scope.setEditing(next === 'edit'); else setOwnMode(next); };
  const presence = useBodyPresence(store.editing, canEdit && mode === 'edit');
  // 글꼴은 화면 설정이 정한다(명조를 고르면 본문은 언제나 명조).
  const font: DocumentFont = useSerifBody() ? 'serif' : 'default';
  const [isBusy, setBusy] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [saveFailure, setSaveFailure] = useState('');
  const [titleConflict, setTitleConflict] = useState(false);
  const [isTitleAsked, setTitleAsked] = useState(false);
  const saveInFlight = useRef<Promise<void> | null>(null);
  const [isLatestAsked, setLatestAsked] = useState(false);
  // 버전 기록은 주소를 가진 다이얼로그다(…/history, 라우트 마스킹). 페이지 메뉴의 항목은 ref로 지금의 여는 법을 부른다.
  const history = useMaskedDialog('history');
  const openHistoryRef = useRef(history.open);
  openHistoryRef.current = history.open;
  const box = useRef<HTMLDivElement>(null);
  const [isCommenting, setCommenting] = useState(false);
  // 앱 안의 주소로 가는 링크(문서 언급, 블록 링크)는 새 탭을 열지 않고 그 화면으로 간다. 편집 중에는 누르기가 글 고르기라 두지 않는다.
  const navigate = useNavigate();
  const followInside = (event: MouseEvent<HTMLDivElement>) => {
    if (isEditing || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest('a');
    const href = anchor?.getAttribute('href');
    // 이 서비스의 화면 주소만 안에서 연다. 파일 받기(download)와 API 주소(첨부 파일)는 브라우저가 그대로 연다: 화면 길로 보내면
    // 맞는 화면이 없어 첫 화면으로 간다.
    if (!href || !/^\/(?!\/)/.test(href) || anchor?.hasAttribute('download') || href.startsWith('/api/')) return;
    event.preventDefault();
    void navigate({ href });
  };
  // The title (when the detail edits it with the body) and the body, kept together.
  const save = (overLatestTitle = false): Promise<void> => {
    if (saveInFlight.current) return saveInFlight.current;
    setSaving(true); setSaveFailure(''); setTitleConflict(false);
    const job = (async () => { await scope?.saveTitle(overLatestTitle); await body.save(); })()
      .catch((error: unknown) => { setSaveFailure(error instanceof Error ? error.message : '저장하지 못했습니다.'); setTitleConflict(error instanceof ApiError && error.status === 409 && !!scope?.isTitleChanged); throw error; })
      .finally(() => { setSaving(false); saveInFlight.current = null; });
    saveInFlight.current = job;
    return job;
  };
  const switchMode = (next: 'read' | 'edit') => {
    if (!canEdit) return;
    if (next === 'read') void save().then(() => setMode(next)).catch(() => undefined);
    else if (onEdit) onEdit();
    else if (presence.others.length) setEditingAsked(true);
    else setMode(next);
  };
  const isEditing = canEdit && mode === 'edit';
  // Ctrl+S (⌘S) saves while editing, in place of the browser's own 저장.
  useEffect(() => {
    if (!isEditing) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void save().catch(() => undefined);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const act = (work: () => Promise<void>) => {
    setBusy(true);
    work().catch(() => undefined).finally(() => setBusy(false));
  };
  const isStopped = body.status === 'conflict' || body.status === 'failed';
  const versions = body.versions.map(version => ({ ...version, title: version.title || title }));
  const openHistory = () => history.open();
  const paged = usePagedBody({ body, print });
  const editor = (value: JSONNode) => <RichDocument documentId={`${body.documentId}${paged.key}`} value={value}
    mode={canEdit ? mode : 'read'} font={font} links={links} upload={body.upload} extensions={paged.extensions} tableMinWidth={paged.tableMinWidth} frame={paged.frame} onReady={paged.onReady}
    onChange={next => { if (mode === 'edit') { body.change(paged.withSetup(next)); publishHeadings?.(headingsOf(next)); } }} />;
  const isChanged = body.status === 'unsaved' || !!scope?.isTitleChanged;
  const status = scope?.isTitleChanged && body.status !== 'saving' ? '저장 안 됨' : statusText[body.status] ?? '';
  const isEditable = canEdit && body.value !== null;
  // A phone keeps 편집 in the head and, while editing, 저장 and 완료 in the bar at the page's foot (DESIGN.md 휴대폰 화면 구조).
  const isPhoneEditing = isPhone && isEditing;
  const isSaveBusy = isSaving || body.status === 'saving';
  const saveButton = (size: 'sm' | 'default') => <Tip tip="Ctrl+S"><Button variant="secondary" size={size} disabled={!isChanged || isSaveBusy}
    onClick={() => void save().catch(() => undefined)}>{busy(isSaveBusy)}저장</Button></Tip>;
  const doneButton = (size: 'sm' | 'default') => <Tip tip="저장하고 돌아가기"><Button size={size} disabled={isSaving} onClick={() => switchMode('read')}>완료</Button></Tip>;
  const tools = isPhoneEditing && page?.foot ? null : <>
    {isEditing ? <>
      {isPhone ? null : <span className="text-xs whitespace-nowrap text-muted-foreground" role="status">{status}</span>}
      {saveButton('sm')}
    </> : null}
    {isPhone ? null : <>
      {comments?.canComment && !isEditing ? <Tip tip="블록을 골라 댓글 달기 (Esc 취소)"><Button variant="tool" size="icon" aria-label="댓글 추가"
        aria-pressed={isCommenting} onClick={() => setCommenting(on => !on)}><CommentIcon chosen={isCommenting} /></Button></Tip> : null}
      {store.history && historyHref && !isEditing ? <Tip tip="버전 기록"><Button variant="tool" size="icon" aria-label="버전 기록" onClick={openHistory}><RestoreIcon /></Button></Tip> : null}
    </>}
    {canEdit ? isEditing
      ? <>
        {isPhone ? null : <Button variant="ghost" size="sm" disabled={isSaving} onClick={() => setMode('read')}>취소</Button>}
        {doneButton('sm')}
      </>
      : <Tip tip="편집"><Button variant={isPhone ? 'ghost' : 'tool'} size="icon" aria-label="편집" disabled={!isEditable} onClick={() => switchMode('edit')}>
        <PenSquareIcon />
      </Button></Tip> : null}
  </>;
  // What the body adds to its page's menu: a phone's 버전 기록. Its handler only sets this body's own state, so the menu
  // is set again only when the phone or what the body keeps changes.
  const setMenuActions = page?.setMenuActions;
  // 고치는 동안에는 버전 기록을 두지 않는다(그 맥락에 쓸 일이 없다).
  const hasHistory = !!store.history && !!historyHref && !isEditing;
  useEffect(() => {
    if (!setMenuActions) return;
    const more: MenuAction[] = isPhone && hasHistory ? [{ label: '버전 기록', icon: RestoreIcon, onSelect: () => openHistoryRef.current() }] : [];
    setMenuActions(more);
    return () => setMenuActions([]);
  }, [setMenuActions, isPhone, hasHistory]);
  const titleAsk = <ConfirmDialog open={isTitleAsked} onOpenChange={setTitleAsked} title="바뀐 제목을 덮어쓸까요?"
    description={`현재 제목: ${scope?.title ?? title} · 내 제목: ${scope?.draft ?? ''}`} cancelLabel="계속 작성"
    action={{ label: '내 제목으로 저장', variant: 'default', isPending: isSaving, onAction: () => { setTitleAsked(false); void save(true).catch(() => undefined); } }} />;
  return <div className="flex min-w-0 flex-col gap-3">
    {titleAsk}
    <ConfirmDialog open={isEditingAsked} onOpenChange={setEditingAsked} title="다른 사람이 수정 중입니다"
      description="편집을 시작해도 다른 사람의 작업을 잠그지 않습니다. 동시에 저장하면 충돌할 수 있습니다."
      action={{ label: '편집 시작', variant: 'default', onAction: () => { setEditingAsked(false); setMode('edit'); } }} />
    {page?.slot ? createPortal(tools, page.slot) : <div className="flex items-center justify-end gap-1">{tools}</div>}
    {isPhoneEditing && page?.foot ? createPortal(<>{saveButton('default')}{doneButton('default')}</>, page.foot) : null}
    {presence.others.length ? <BodyBanner status="info" title={`${presence.others.map(person => person.name).join(' · ')} 님이 수정 중입니다`} description="동시에 저장하면 충돌할 수 있습니다." /> : null}
    {presence.failure ? <p className="text-xs text-muted-foreground" role="status">{presence.failure}</p> : null}
    {body.hasNewer && !isStopped ? <BodyBanner status="info" title="다른 곳에서 본문이 바뀌었습니다"
      actions={<Button variant="secondary" size="sm" disabled={isBusy}
        onClick={() => body.isUnsaved() ? setLatestAsked(true) : act(body.takeLatest)}>{busy(isBusy)}최신 내용 보기</Button>} /> : null}
    {saveFailure && !isStopped ? <BodyBanner status="error" title={saveFailure} description="작성 중인 내용은 그대로 있습니다. 고친 뒤 다시 저장해 주세요."
      actions={titleConflict ? <Button variant="secondary" size="sm" onClick={() => setTitleAsked(true)}>제목 비교</Button> : undefined} /> : null}
    {isStopped ? <BodyBanner status={body.status === 'conflict' ? 'warning' : 'error'}
      title={body.status === 'conflict'
        ? '다른 곳에서 먼저 바뀌어 저장하지 못했습니다. 작성 중인 내용은 이 화면에 그대로 있습니다.'
        : `${body.failure} 작성 중인 내용은 이 화면에 그대로 있습니다.`}
      actions={body.status === 'conflict'
        ? <>
          <Button size="sm" disabled={isBusy} onClick={() => act(body.keepMine)}>{busy(isBusy)}내 내용으로 다시 저장</Button>
          <Button variant="secondary" size="sm" disabled={isBusy} onClick={() => setLatestAsked(true)}>최신 내용 보기</Button>
        </>
        : <Button size="sm" disabled={isBusy} onClick={() => act(body.retry)}>{busy(isBusy)}다시 시도</Button>} /> : null}
    {body.value ? <PagedBody paged={paged} isEditing={isEditing} links={links}>
      <div ref={box} className={comments ? `flex flex-col ${blockCommentBox}` : 'flex flex-col'} onClickCapture={followInside}>
        {editor(body.value)}
        {comments && !isEditing && !print ? <BlockCommentLayer box={box} comments={comments} isCommenting={isCommenting}
          onCommenting={setCommenting} /> : null}
      </div>
    </PagedBody> : null}
    {history.isOpen && store.history && historyHref ? <VersionHistoryDialog versions={versions}
      onSelect={version => void navigate({ href: `${historyHref}/${version.id}` })} onClose={history.close}
      onExpand={() => void navigate({ href: historyHref })} /> : null}
    <ConfirmDialog open={isLatestAsked} onOpenChange={open => { if (!open && !isBusy) setLatestAsked(false); }}
      title="최신 내용으로 바꿀까요?" description="이 화면에서 작성했지만 저장하지 못한 내용은 사라집니다."
      action={{ label: '최신 내용 보기', isPending: isBusy, onAction: () => act(async () => { await body.takeLatest(); setLatestAsked(false); setMode('read'); }) }} />
    <ConfirmDialog open={body.leave.isAsked} onOpenChange={open => { if (!open) body.leave.answer(false); }}
      title="저장하지 않은 내용이 있습니다" description="지금 나가면 저장하지 않은 내용이 사라집니다. 남기려면 계속 작성을 눌러 저장하세요."
      cancelLabel="계속 작성" action={{ label: '버리고 나가기', onAction: () => body.leave.answer(true) }} />
  </div>;
}
