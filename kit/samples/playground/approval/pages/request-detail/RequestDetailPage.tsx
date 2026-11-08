import { celebrate } from '@kit/foundations/motion/celebrate';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import { AlertDialog } from '@kit/composites/dialog/AlertDialog';
import { FormDialog } from '@kit/composites/dialog/FormDialog';
import { PropertyPill } from '@kit/composites/property/PropertyPill';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { DetailLayout } from '@kit/layouts/detail/DetailLayout';
import { Page } from '@kit/layouts/page/Page';
import { PageActions, PageBanner } from '@kit/layouts/page/PageParts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { approvalKeys, approvalQueries, currentOf, daysOf, dayWeekText, leaveLabel, me, titleOf, useApprovalApi, type DecisionResult } from '../../entities/approval';
import { Person, ResultMark, Timeline } from '../../entities/approval/ui';
import styles from './detail.module.css';

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
    onSuccess: (_, input) => { if(input.result === 'approved') celebrate(document.activeElement); setAsking(undefined); setReason(''); setTried(false); return client.invalidateQueries({ queryKey: approvalKeys.all }); },
  });
  const crumbs = (title: string, isMine = true) => [isMine ? { label: '내 신청', href: '/requests', icon: 'document' as const } : { label: '결재할 문서', href: '/inbox', icon: 'inbox' as const }, { label: title }];
  if (query.isPending) return <Page crumbs={crumbs(id)} isDetail><Center height="100%"><Spinner label="신청을 불러오는 중" /></Center></Page>;
  if (query.isError && !query.data) {
    const isMissing = (query.error as { status?: number }).status === 404;
    return <Page crumbs={crumbs(isMissing ? '없는 신청' : id)} isDetail>
      <PageState kind={isMissing ? 'not-found' : 'error'} title={isMissing ? '신청을 찾을 수 없습니다' : '신청을 불러오지 못했습니다'}
        description={isMissing ? '지워졌거나 주소가 바뀌었을 수 있습니다.' : '잠시 후 다시 시도해 주세요.'}
        action={isMissing ? <Button label="내 신청으로" variant="secondary" href="/requests" /> : <Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />
    </Page>;
  }
  const approval = query.data;
  const isMine = approval.applicant === me;
  const isMyTurn = !isMine && currentOf(approval)?.approver === me;
  const submitReject = () => {
    if (!reason.trim()) { setTried(true); requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    decide.mutate({ result: 'rejected', opinion: reason });
  };
  const isLastApprover = approval.line.filter(each => each.state === 'pending').length === 1;
  return <Page crumbs={crumbs(approval.id, isMine)} isDetail hasHeading={false}>
    {decide.isError && !asking ? <PageBanner status="error" title="결재를 처리하지 못했습니다"
      description={(decide.error as { status?: number }).status === 409 ? '이미 처리되었거나 내 차례가 아닙니다. 화면을 새로 읽었습니다.' : '잠시 후 다시 시도해 주세요.'} /> : null}
    <DetailLayout label={titleOf(approval)}
      head={<HStack gap={2} vAlign="center"><Text color="secondary" type="supporting" hasTabularNumbers>{approval.id}</Text><ResultMark approval={approval} /></HStack>}
      title={<Heading level={1}>{titleOf(approval)}</Heading>}
      sections={[
        { title: '신청', items: <>
          <PropertyPill label="신청자" icon={null} isEmpty={false} isDisabled text={<Person name={approval.applicant} />} />
          <PropertyPill label="종류" icon={icon('document')} isEmpty={false} isDisabled text={leaveLabel(approval.kind)} />
          <PropertyPill label="기간" icon={icon('calendar')} isEmpty={false} isDisabled
            text={approval.start === approval.end ? dayWeekText(approval.start) : `${dayWeekText(approval.start)} – ${dayWeekText(approval.end)}`} />
          <PropertyPill label="일수" icon={icon('clock')} isEmpty={false} isDisabled text={`${daysOf(approval)}일`} />
        </> },
      ]}>
      <VStack as="section" gap={2} aria-label="사유">
        <Heading level={2}>사유</Heading>
        <Text className={styles.reason}>{approval.reason}</Text>
      </VStack>
      <VStack as="section" gap={3} aria-label="진행 상태">
        <Heading level={2}>진행 상태</Heading>
        <Timeline approval={approval} />
      </VStack>
    </DetailLayout>
    {isMyTurn ? <PageActions>
      <Button label="반려" variant="secondary" size="sm" onClick={() => setAsking('rejected')} />
      <Button label="승인" variant="primary" size="sm" onClick={() => setAsking('approved')} />
    </PageActions> : null}
    <AlertDialog isOpen={asking === 'approved'} onOpenChange={open => { if (!open) setAsking(undefined); }}
      title="승인할까요?" description={isLastApprover ? '승인하면 결재가 모두 끝나고 신청자에게 승인으로 알려집니다.' : '승인하면 다음 결재자에게 넘어갑니다. 승인한 뒤에는 바꿀 수 없습니다.'}
      actionLabel="승인" actionVariant="primary" isActionLoading={decide.isPending}
      onAction={() => decide.mutate({ result: 'approved' }, { onError: () => setAsking(undefined) })} />
    {asking === 'rejected' ? <FormDialog title="반려 이유" subtitle={`${approval.applicant}님의 ${titleOf(approval)}`} submitLabel="반려하기" isDestructive isPending={decide.isPending}
      error={decide.isError ? '반려하지 못했습니다. 입력한 이유는 그대로 있습니다.' : undefined}
      onSubmit={submitReject} onClose={() => { setAsking(undefined); setReason(''); setTried(false); decide.reset(); }}>
      <TextArea label="이유" rows={4} hasAutoFocus value={reason} onChange={setReason} placeholder="신청자가 고쳐서 다시 낼 수 있게 이유를 적어 주세요."
        statusVariant="detached" status={isTried && !reason.trim() ? { type: 'error', message: '반려 이유를 입력해 주세요.' } : undefined} />
    </FormDialog> : null}
  </Page>;
}
