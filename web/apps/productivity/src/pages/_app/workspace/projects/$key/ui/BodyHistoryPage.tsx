import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState, type ReactNode } from 'react';
import { documentOptions } from '@/entities/document';
import { workItemOptions, workItemPath } from '@/entities/work-item';
import { getJson, sendJson, type components } from '@/shared/api';
import { sessionOptions } from '@/shared/auth';
import { blank, prepareDocument, VersionList, type JSONNode, type VersionRecord } from '@/shared/lib/rich-document';
import { Button } from '@/shared/ui/kit/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/ui/kit/icon';
import { DetailSurface } from '@/shared/ui/kit/detail-surface';
import { useOwnPageTitle } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { bodyStateOptions } from '@/shared/ui/rich-body';
import { SegmentedControl } from '@/shared/ui/kit/segmented-control';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/kit/tooltip';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { SplitDiff } from './SplitDiff';

type BodyState = components['schemas']['RichBodyState'];
type BodyVersion = components['schemas']['RichBodyVersion'];
/** 라우터가 넘기는 경로 한 단계: 아이콘은 의미 이름이다(키트 Page에는 pageCrumbs로 바꿔 넘긴다). */
type Crumb = { label: string; href?: string; icon?: string };
/** 버전 기록을 가진 본문: 문서 하나, 또는 업무 하나. */
export type HistoryTarget = { kind: 'document'; projectKey: string; documentId: string } | { kind: 'work-item'; projectKey: string; number: number };

const when = (created: string) => new Date(created).toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const asDoc = (body: unknown) => prepareDocument((body ?? blank) as JSONNode) as JSONNode;
/** 버전 기록 페이지: 넓은 한 열(나란히 보기 diff가 양쪽 글을 담도록). */
const COLUMN = 'mx-auto flex w-full max-w-288 flex-col gap-4 px-4 pt-6 pb-8 max-md:px-3 max-md:pt-4';

/** 이 페이지의 제목: 이 제목이 페이지의 h1이라 Page 머리 줄은 h1을 두지 않는다. */
function Title({ children }: { children: ReactNode }) {
  useOwnPageTitle();
  return <h1 className="text-2xl leading-[1.3] font-bold tracking-[-0.02em]">{children}</h1>;
}

/** 본문의 주소와 제목·쓰기 권한·상세 주소. */
function useTarget(target: HistoryTarget) {
  const document = useQuery({ ...documentOptions(target.kind === 'document' ? target.documentId : ''), enabled: target.kind === 'document' });
  const workItem = useQuery({ ...workItemOptions(target.projectKey, target.kind === 'work-item' ? target.number : 0), enabled: target.kind === 'work-item' });
  if (target.kind === 'document') return {
    base: `/api/v1/workspace/documents/${encodeURIComponent(target.documentId)}/body`, label: '문서', listHref: `/workspace/projects/${target.projectKey}/documents`,
    detailHref: `/workspace/projects/${target.projectKey}/documents/${target.documentId}`,
    title: document.data?.document.title, canWrite: !!document.data?.canWrite, isError: document.isError,
  };
  return {
    base: `${workItemPath(target.projectKey, target.number)}/body`, label: '업무', listHref: `/workspace/projects/${target.projectKey}/work-items`,
    detailHref: `/workspace/projects/${target.projectKey}/work-items/${target.number}`,
    title: workItem.data?.issue.title, canWrite: !!workItem.data?.canWrite, isError: workItem.isError,
  };
}

/**
 * 버전 기록 페이지(상세의 버전 기록 다이얼로그와 같은 주소, …/history): 다른 상세와 같은 뒤로가기 틀에(2026-11-15, 둥근 ← 는
 * 그 문서 · 업무로) 남은 버전의 목록. 버전을 고르면 그 버전의 페이지
 * (…/history/{버전})에서 git의 커밋 하나처럼 바로 앞 버전에서 무엇이 바뀌었는지 블록마다 보이고(바뀌지 않은 블록은 빼고), '지금 본문과'로
 * 그 버전 이후 지금까지의 변경도 본다. 쓸 수 있으면 그 버전으로 복원한다(지금 본문은 버전으로 남는다).
 */
export function BodyHistoryPage({ crumbs, target, versionId }: { crumbs: Crumb[]; target: HistoryTarget; versionId?: string }) {
  const navigate = useNavigate();
  const session = useQuery(sessionOptions()).data;
  const owner = useTarget(target);
  const state = useQuery(bodyStateOptions(owner.base, session?.id ?? ''));
  const versions: VersionRecord[] = useMemo(() => (state.data?.versions ?? []).map(version => ({
    id: version.id, reason: version.reason, label: version.label, title: owner.title ?? '', created: version.created,
  })), [state.data?.versions, owner.title]);
  const historyHref = `${owner.detailHref}/history`;
  const base = [...crumbs.slice(0, -1), { label: owner.label, href: owner.listHref }, { label: owner.title ?? owner.label, href: owner.detailHref }];
  if (owner.isError || state.isError) return <DetailSurface surface="page" title="버전 기록" crumbs={pageCrumbs([...base, { label: '버전 기록' }])}>
    <PageState kind="not-found" title="버전 기록을 볼 수 없습니다" description={state.error?.message} />
  </DetailSurface>;
  if (!versionId) return <DetailSurface surface="page" title="버전 기록" crumbs={pageCrumbs([...base, { label: '버전 기록' }])}>
    <div className="flex flex-1 flex-col bg-background">
      <div className={COLUMN}>
        <div className="flex flex-col gap-1">
          <Title>버전 기록</Title>
        </div>
        {state.isPending ? <p className="text-muted-foreground">버전을 불러오는 중…</p>
          : <VersionList versions={versions} listClassName="overflow-hidden rounded-xl border bg-card"
            onSelect={version => void navigate({ href: `${historyHref}/${version.id}` })} />}
      </div>
    </div>
  </DetailSurface>;
  return <VersionPage crumbs={[...base, { label: '버전 기록', href: historyHref }]} owner={owner} state={state.data} versions={versions}
    versionId={versionId} historyHref={historyHref} />;
}

function StepButton({ label, isDisabled, onClick, children }: { label: string; isDisabled: boolean; onClick: () => void; children: ReactNode }) {
  return <Tooltip>
    <TooltipTrigger render={<Button variant="tool" size="icon" aria-label={label} disabled={isDisabled} onClick={onClick} />}>{children}</TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>;
}

function VersionPage({ crumbs, owner, state, versions, versionId, historyHref }: {
  crumbs: Crumb[]; owner: ReturnType<typeof useTarget>; state?: BodyState; versions: VersionRecord[]; versionId: string; historyHref: string;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const session = useQuery(sessionOptions()).data;
  const [against, setAgainst] = useState<'previous' | 'current'>('previous');
  const [isAsking, setAsking] = useState(false);
  const [isRestoring, setRestoring] = useState(false);
  const [failure, setFailure] = useState('');
  const at = versions.findIndex(version => version.id === versionId);
  const version = versions[at], previous = at >= 0 ? versions[at + 1] : undefined, newer = at > 0 ? versions[at - 1] : undefined;
  const read = (id?: string) => ({
    queryKey: ['body-version', owner.base, id ?? ''] as const,
    queryFn: ({ signal }: { signal: AbortSignal }) => getJson<BodyVersion>(`${owner.base}/versions/${encodeURIComponent(id!)}`, signal),
    enabled: !!id, staleTime: Infinity,
  });
  const kept = useQuery(read(versionId));
  const before = useQuery(read(previous?.id));
  // 왼쪽(전)과 오른쪽(후): 앞 버전 → 이 버전, 또는 이 버전 → 지금 본문.
  const pair = useMemo(() => {
    if (!kept.data) return null;
    if (against === 'current') return state ? { before: asDoc(kept.data.body), after: asDoc(state.body) } : null;
    if (previous && !before.data) return null;
    return { before: asDoc(previous ? before.data!.body : null), after: asDoc(kept.data.body) };
  }, [kept.data, before.data, previous, against, state]);
  const restore = async () => {
    if (!state) return;
    setRestoring(true); setFailure('');
    try {
      await sendJson(`${owner.base}/revisions/${encodeURIComponent(versionId)}/restore`, 'POST', { expectedVersion: state.version });
      await client.invalidateQueries({ queryKey: bodyStateOptions(owner.base, session?.id ?? '').queryKey });
      void navigate({ href: owner.detailHref });
    } catch (error) {
      setFailure(error instanceof Error ? error.message : '복원하지 못했습니다.');
      setRestoring(false); setAsking(false);
    }
  };
  if (state && !version) return <DetailSurface surface="page" title="버전 기록" crumbs={pageCrumbs([...crumbs, { label: '버전' }])}>
    <PageState kind="not-found" title="이 버전을 찾을 수 없습니다" description="최근 50개 버전만 볼 수 있습니다."
      action={<Button variant="secondary" onClick={() => void navigate({ href: historyHref })}>버전 기록으로</Button>} />
  </DetailSurface>;
  const title = version ? when(version.created) : '버전';
  return <DetailSurface surface="page" title="버전 기록" crumbs={pageCrumbs([...crumbs, { label: title }])}>
    <div className="flex flex-1 flex-col bg-background">
      <div className={COLUMN}>
        <div className="flex flex-wrap items-start justify-between gap-3 max-md:flex-col max-md:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Title>{title}</Title>
            <p className="text-xs text-muted-foreground">{version?.label}{previous ? ` · 앞 버전 ${when(previous.created)}` : ' · 가장 처음 남은 버전'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <StepButton label="앞 버전" isDisabled={!previous} onClick={() => previous && void navigate({ href: `${historyHref}/${previous.id}` })}><ChevronLeftIcon /></StepButton>
              <StepButton label="다음 버전" isDisabled={!newer} onClick={() => newer && void navigate({ href: `${historyHref}/${newer.id}` })}><ChevronRightIcon /></StepButton>
            </div>
            {owner.canWrite ? <Button size="sm" onClick={() => setAsking(true)}>이 버전으로 복원</Button> : null}
          </div>
        </div>
        <SegmentedControl label="비교" className="self-start" value={against} onChange={setAgainst}
          options={[{ value: 'previous', label: '앞 버전과' }, { value: 'current', label: '지금 본문과' }]} />
        {failure ? <p role="alert" className="text-sm text-destructive">{failure}</p> : null}
        <p className="text-xs text-muted-foreground">{against === 'previous'
          ? (previous ? '바로 앞 버전(−, 이전)에서 이 버전(+, 이후)으로 바뀐 것입니다.' : '처음 남은 버전이라 모든 내용이 새로 들어간 것으로 보입니다.')
          : '이 버전(−, 이전)에서 지금 본문(+, 이후)까지 바뀐 것입니다. 복원하면 지금 본문이 이 버전으로 돌아갑니다.'}</p>
        {pair === null ? <p className="text-muted-foreground">버전을 불러오는 중…</p>
          : <SplitDiff before={pair.before} after={pair.after} title={owner.title ?? '본문'} />}
      </div>
    </div>
    <ConfirmDialog open={isAsking} onOpenChange={open => { if (!open && !isRestoring) setAsking(false); }}
      title="이 버전으로 복원할까요?" description="지금 본문은 버전으로 남으니 언제든 다시 되돌릴 수 있습니다."
      action={{ label: '복원', variant: 'default', isPending: isRestoring, onAction: () => void restore() }} />
  </DetailSurface>;
}
