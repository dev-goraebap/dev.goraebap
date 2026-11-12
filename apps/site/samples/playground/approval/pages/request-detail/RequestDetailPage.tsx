import { focusFirstInvalid } from '@/shared/lib/focus-invalid';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { FormDialog } from '@/shared/ui/form-dialog';
import { CalendarIcon, ClockIcon, FileTextIcon, InboxIcon, TriangleAlertIcon } from '@/shared/ui/icon';
import { InfoPill } from '@/shared/ui/info-pill';
import { Page, type Crumb } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { DetailLayout } from '@/shared/ui/reading';
import { Spinner } from '@/shared/ui/spinner';
import { Textarea } from '@/shared/ui/textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { approvalKeys, approvalQueries, currentOf, daysOf, dayWeekText, leaveLabel, me, ResultMark, Timeline, titleOf, useApprovalApi,
  type DecisionResult } from '../../entities/approval';

const plain = (children: ReactNode) => <div className="flex flex-1 flex-col bg-background">{children}</div>;

/**
 * 신청 상세. 신청자에게는 진행 상태를 보이고, 지금 내 차례인 결재자에게는 같은 화면 바닥 고정 줄에 반려·승인을 더한다.
 * 승인은 확인 창, 반려는 이유를 반드시 받는 창을 거친다. 결정 뒤에는 같은 화면의 타임라인이 바뀌어 결과가 바로 보인다.
 */
export function RequestDetailPage({ id }: { id: string }) {
  const api = useApprovalApi();
  const client = useQueryClient();
  const query = useQuery(approvalQueries.detail(api, id));
  const [asking, setAsking] = useState<DecisionResult | undefined>();
  const [reason, setReason] = useState('');
  const [isTried, setTried] = useState(false);
  const decide = useMutation({
    mutationFn: (input: { result: DecisionResult; opinion?: string }) => api.decide(id, me, input.result, input.opinion),
    onSuccess: () => { setAsking(undefined); setReason(''); setTried(false); return client.invalidateQueries({ queryKey: approvalKeys.all }); },
  });
  const crumbs = (title: string, isMine = true): Crumb[] => [isMine ? { label: '내 신청', href: '/requests', icon: FileTextIcon } : { label: '결재할 문서', href: '/inbox', icon: InboxIcon }, { label: title }];
  if (query.isPending) {
    return <Page crumbs={crumbs(id)} isFullScreen>{plain(<div className="flex flex-1 items-center justify-center"><Spinner aria-label="신청을 불러오는 중" className="size-6" /></div>)}</Page>;
  }
  if (query.isError && !query.data) {
    const isMissing = (query.error as { status?: number }).status === 404;
    return (
      <Page crumbs={crumbs(isMissing ? '없는 신청' : id)} isFullScreen>
        {plain(<PageState kind={isMissing ? 'not-found' : 'error'} title={isMissing ? '신청을 찾을 수 없습니다' : '신청을 불러오지 못했습니다'}
          description={isMissing ? '지워졌거나 주소가 바뀌었을 수 있습니다.' : '잠시 후 다시 시도해 주세요.'}
          action={isMissing
            ? <Button variant="secondary" nativeButton={false} render={<Link to={"/requests" as string} />}>내 신청으로</Button>
            : <Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />)}
      </Page>
    );
  }
  const approval = query.data;
  const isMine = approval.applicant === me;
  const isMyTurn = !isMine && currentOf(approval)?.approver === me;
  const submitReject = () => {
    if (!reason.trim()) { setTried(true); focusFirstInvalid(); return; }
    decide.mutate({ result: 'rejected', opinion: reason });
  };
  const closeReject = () => { setAsking(undefined); setReason(''); setTried(false); decide.reset(); };
  const isLastApprover = approval.line.filter(each => each.state === 'pending').length === 1;
  const isReasonMissing = isTried && !reason.trim();
  return (
    <Page crumbs={crumbs(approval.id, isMine)} isFullScreen
      // 결정 줄: 지금 내 차례인 결재자에게만 바닥에 붙는다.
      footer={isMyTurn ? <>
        <Button variant="secondary" onClick={() => setAsking('rejected')}>반려</Button>
        <Button onClick={() => setAsking('approved')}>승인</Button>
      </> : undefined}
      below={decide.isError && !asking ? (
        <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
          <TriangleAlertIcon />
          <AlertTitle>결재를 처리하지 못했습니다</AlertTitle>
          <AlertDescription>
            {(decide.error as { status?: number }).status === 409 ? '이미 처리되었거나 내 차례가 아닙니다. 화면을 새로 읽었습니다.' : '잠시 후 다시 시도해 주세요.'}
          </AlertDescription>
        </Alert>
      ) : undefined}>
      <DetailLayout label={titleOf(approval)} title={titleOf(approval)}
        head={<p className="flex items-center gap-2 text-sm text-muted-foreground"><span className="tabular-nums">{approval.id}</span><ResultMark approval={approval} /></p>}
        sections={[{ title: '신청', items: <>
          <InfoPill label="신청자" icon={<PersonAvatar name={approval.applicant} className="size-4" />}>{approval.applicant}</InfoPill>
          <InfoPill label="종류" icon={<FileTextIcon />}>{leaveLabel(approval.kind)}</InfoPill>
          <InfoPill label="기간" icon={<CalendarIcon />}>
            {approval.start === approval.end ? dayWeekText(approval.start) : `${dayWeekText(approval.start)} – ${dayWeekText(approval.end)}`}
          </InfoPill>
          <InfoPill label="일수" icon={<ClockIcon />}>{`${daysOf(approval)}일`}</InfoPill>
        </> }]}>
        <section aria-label="사유" className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">사유</h2>
          <p className="text-base leading-relaxed [overflow-wrap:anywhere]">{approval.reason}</p>
        </section>
        <section aria-label="진행 상태" className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">진행 상태</h2>
          <Timeline approval={approval} />
        </section>
      </DetailLayout>
      {/* 승인은 되돌릴 수 없지만 지우는 일은 아니라 기본 색 동작으로 묻는다. */}
      <ConfirmDialog open={asking === 'approved'} onOpenChange={open => { if (!open) setAsking(undefined); }} title="승인할까요?"
        description={isLastApprover ? '승인하면 결재가 모두 끝나고 신청자에게 승인으로 알려집니다.' : '승인하면 다음 결재자에게 넘어갑니다. 승인한 뒤에는 바꿀 수 없습니다.'}
        action={{ label: '승인', variant: 'default', isPending: decide.isPending,
          onAction: () => decide.mutate({ result: 'approved' }, { onError: () => setAsking(undefined) }) }} />
      <FormDialog open={asking === 'rejected'} onOpenChange={open => { if (!open) closeReject(); }} title="반려 이유" description={`${approval.applicant}님의 ${titleOf(approval)}`}
        submitLabel="반려하기" isDestructive isPending={decide.isPending} onSubmit={submitReject}>
        <div className="flex flex-col gap-2">
          <Textarea aria-label="이유" rows={4} autoFocus value={reason} onChange={event => setReason(event.target.value)} aria-invalid={isReasonMissing || undefined}
            placeholder="신청자가 고쳐서 다시 낼 수 있게 이유를 적어 주세요." className="max-md:text-base" />
          {isReasonMissing ? <p role="alert" className="text-sm text-destructive">반려 이유를 입력해 주세요.</p> : null}
          {decide.isError ? <p role="alert" className="text-sm text-destructive">반려하지 못했습니다. 입력한 이유는 그대로 있습니다.</p> : null}
        </div>
      </FormDialog>
    </Page>
  );
}
