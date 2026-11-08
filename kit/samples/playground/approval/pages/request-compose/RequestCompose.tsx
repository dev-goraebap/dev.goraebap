import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Step, Stepper } from '@astryxdesign/core/Stepper';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import { DatePill, OptionPill } from '@kit/composites/property/PropertyPill';
import { PaperForm } from '@kit/patterns/compose/ComposeForm';
import { ComposeSurface } from '@kit/patterns/compose/ComposeSurface';
import { useDraft } from '@kit/patterns/compose/draft-store';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { annualBalance, approvalKeys, dayWeekText, defaultLine, leaveKinds, leaveLabel, me, today, useApprovalApi, weekdays,
  type LeaveKind, type LinePerson } from '../../entities/approval';
import { LineEditor } from './LineEditor';
import styles from './compose.module.css';

export type ComposeStep = 'info' | 'line' | 'review';
const steps: { id: ComposeStep; label: string }[] = [{ id: 'info', label: '정보' }, { id: 'line', label: '결재선' }, { id: 'review', label: '확인' }];

type Draft = { kind: LeaveKind; start?: string; end?: string; reason: string; line: LinePerson[] };
const initial: Draft = { kind: 'annual', reason: '', line: defaultLine };

/** 단계마다 그 단계의 값만 검사한다. 마지막 제출은 모든 단계를 다시 검사한다. */
function checkDraft(draft: Draft) {
  const days = draft.start && draft.end ? weekdays(draft.start, draft.end) : 0;
  return {
    days,
    dates: !draft.start || !draft.end ? '시작일과 종료일을 정해 주세요.'
      : draft.end < draft.start ? '종료일이 시작일보다 앞섭니다.'
      : draft.kind === 'annual' && days > annualBalance ? `남은 연차 ${annualBalance}일을 넘습니다.` : undefined,
    reason: draft.reason.trim() ? undefined : '사유를 입력해 주세요.',
    line: draft.line.length ? undefined : '결재자를 한 명 이상 정해 주세요.',
  };
}

/** 첫 빠진 칸으로 초점을 옮긴다. 단계가 바뀌어 그려진 뒤에 찾는다. */
const focusInvalid = () => requestAnimationFrame(() => requestAnimationFrame(() => {
  (document.querySelector<HTMLElement>('[aria-invalid="true"]') ?? document.querySelector<HTMLElement>('[data-invalid-field] button'))?.focus();
}));

/**
 * 휴가 신청: 여러 사람의 결정이 걸린 신청이라 단계형이다(정보 → 결재선 → 확인). 단계는 주소의 step이 가지고 값은 라우터 위의 초안이
 * 가진다. 다음은 현재 단계만 검사하고 마지막 제출은 전체를 검사해 빠진 단계로 돌려보낸다. 바닥 줄에는 취소 · 이전 · 다음(제출)만
 * 두고, 남은 연차 같은 안내와 오류는 해당 칸 곁에 둔다.
 */
export function RequestCompose({ step, onStep, onClose, onDone }: {
  step: ComposeStep; onStep: (step: ComposeStep) => void; onClose: () => void; onDone: (id: string) => void;
}) {
  const api = useApprovalApi();
  const client = useQueryClient();
  const [draft, setDraft, clearDraft] = useDraft<Draft>('approval:new', initial);
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const [isTried, setTried] = useState(false);
  const checked = checkDraft(draft);
  const save = useMutation({
    mutationFn: () => api.create({ kind: draft.kind, start: draft.start!, end: draft.end!, reason: draft.reason.trim(), line: draft.line }),
    onSuccess: saved => { void client.invalidateQueries({ queryKey: approvalKeys.all }); clearDraft(); onDone(saved.id); },
  });
  const go = (next: ComposeStep) => { setTried(false); onStep(next); };
  const stop = (to?: ComposeStep) => { setTried(true); if (to && to !== step) onStep(to); focusInvalid(); };
  const submit = () => {
    if (step === 'info') return checked.dates || checked.reason ? stop() : go('line');
    if (step === 'line') return checked.line ? stop() : go('review');
    if (checked.dates || checked.reason) return stop('info');
    if (checked.line) return stop('line');
    save.mutate();
  };
  const index = steps.findIndex(each => each.id === step);
  const progress = <Stepper activeStep={index} label="신청 단계" density="compact" onStepClick={next => go(steps[next].id)}>
    {steps.map((each, order) => <Step key={each.id} step={order} label={each.label} />)}
  </Stepper>;
  const range = draft.start && draft.end && !checked.dates
    ? `${dayWeekText(draft.start)}${draft.start === draft.end ? '' : ` – ${dayWeekText(draft.end)}`} · 평일 ${checked.days}일${draft.kind === 'annual' ? ` · 사용 후 남는 연차 ${annualBalance - checked.days}일` : ''}`
    : `남은 연차 ${annualBalance}일`;
  const showDatesError = isTried && !!checked.dates;
  const parts = step === 'info' ? [
    { label: '종류와 기간', content: <VStack gap={2}>
      <HStack gap={1.5} wrap="wrap" vAlign="center" role="group" aria-label="종류와 기간" data-invalid-field={showDatesError ? '' : undefined}>
        <OptionPill label="종류" icon="document" value={draft.kind} options={leaveKinds.map(each => ({ value: each.id, label: each.label }))}
          onChange={kind => set({ kind: kind as LeaveKind })} />
        <DatePill label="시작일" value={draft.start} today={today} onChange={start => set({ start })} />
        <DatePill label="종료일" value={draft.end} today={today} onChange={end => set({ end })} />
      </HStack>
      {showDatesError ? <Text className={styles.error} type="supporting" role="alert">{checked.dates}</Text>
        : <Text type="supporting" color="secondary" hasTabularNumbers>{range}</Text>}
    </VStack> },
    { label: '사유', content: <TextArea label="사유" isLabelHidden rows={5} value={draft.reason} onChange={reason => set({ reason })} placeholder="결재자가 판단할 수 있게 사유와 업무 인수인계를 적어 주세요."
      status={isTried && checked.reason ? { type: 'error', message: checked.reason } : undefined} /> },
  ] : step === 'line' ? [
    { label: '결재선', content: <VStack gap={2}>
      <Text type="supporting" color="secondary" className={styles.note}>위에서부터 차례로 결재합니다. 앞사람이 승인해야 다음 사람에게 넘어갑니다.</Text>
      <LineEditor line={draft.line} onChange={line => set({ line })} error={isTried ? checked.line : undefined} />
    </VStack> },
  ] : [
    { label: '신청 내용', content: <div className={styles.review}>
      <dl className={styles.summary}>
        <dt>종류</dt><dd>{leaveLabel(draft.kind)}</dd>
        <dt>기간</dt><dd>{draft.start && draft.end ? `${dayWeekText(draft.start)}${draft.start === draft.end ? '' : ` – ${dayWeekText(draft.end)}`}` : '정하지 않음'}</dd>
        <dt>일수</dt><dd>{checked.days}일</dd>
        <dt>사유</dt><dd>{draft.reason.trim() || '비어 있음'}</dd>
      </dl>
      <HStack><Button label="정보 수정" variant="subtle" size="sm" onClick={() => go('info')} /></HStack>
    </div> },
    { label: '결재선', content: <div className={styles.review}>
      <ol className={styles.line} aria-label="결재 순서">
        {draft.line.map((person, order) => <li key={person.approver} className={styles.person}>
          <Text className={styles.order} type="supporting" color="secondary" hasTabularNumbers aria-hidden="true">{order + 1}</Text>
          <Avatar name={person.approver} size="xsm" shape="circle" /><Text>{person.approver} · {person.role}</Text>
        </li>)}
      </ol>
      <Text type="supporting" color="secondary">{me}님이 제출하면 첫 번째 결재자에게 바로 전달됩니다.</Text>
      <HStack><Button label="결재선 수정" variant="subtle" size="sm" onClick={() => go('line')} /></HStack>
    </div> },
  ];
  return <ComposeSurface surface="page" crumbs={[{ label: '내 신청', href: '/requests', icon: 'document' }, { label: '휴가 신청' }]}
    isDirty={JSON.stringify(draft) !== JSON.stringify(initial)}
    onClose={() => { clearDraft(); onClose(); }}
    previous={step === 'info' ? undefined : { onClick: () => go(steps[index - 1].id) }}
    error={save.isError ? '제출하지 못했습니다. 입력한 내용은 그대로 있습니다.' : undefined}
    submit={{ label: step === 'review' ? '제출' : '다음', isPending: save.isPending, onSubmit: submit }}>
    <PaperForm isPage heading="휴가 신청" about={progress} parts={parts} />
  </ComposeSurface>;
}
