import { useDraft } from '@/shared/lib/draft';
import { focusFirstInvalid } from '@/shared/lib/focus-invalid';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ComposeSurface } from '@/shared/ui/compose';
import { DateCalendar } from '@/shared/ui/date-picker';
import { CalendarIcon, CheckIcon, FileTextIcon } from '@/shared/ui/icon';
import { useOwnPageTitle } from '@/shared/ui/page';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { OptionPill, PropertyPill } from '@/shared/ui/property-pill';
import { Textarea } from '@/shared/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { addDays, annualBalance, approvalKeys, dayWeekText, defaultLine, leaveKinds, leaveLabel, me, today, useApprovalApi, weekdays,
  type LeaveKind, type LinePerson } from '../../entities/approval';
import { LINE_ROW, LineEditor } from './LineEditor';

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

/** 첫 빠진 칸(aria-invalid: 알약 · 사유 · 결재자 추가)으로 초점을 옮긴다. 단계가 바뀌어 그려진 다음 프레임에 찾는다. */
const focusInvalid = () => requestAnimationFrame(() => focusFirstInvalid());

const range = (start: string, end: string) => `${dayWeekText(start)}${start === end ? '' : ` – ${dayWeekText(end)}`}`;

/** 날짜 알약: 오늘 · 내일 · 다음 주를 바로 고르거나 달력에서 고른다(키트 DatePill에 빠른 고르기를 더한 것). */
function DayPill({ label, value, onChange, isInvalid }: { label: string; value?: string; onChange: (value: string) => void; isInvalid?: boolean }) {
  const quick = [{ label: '오늘', day: today }, { label: '내일', day: addDays(today, 1) }, { label: '다음 주', day: addDays(today, 7) }];
  return (
    <PropertyPill label={label} isRequired isInvalid={isInvalid} icon={<CalendarIcon />} text={value && dayWeekText(value)} width="w-auto">
      {close => (
        <div className="flex flex-col gap-2 p-1.5">
          <div role="group" aria-label="빠른 고르기" className="flex gap-1">
            {quick.map(each => (
              <Button key={each.label} variant="secondary" size="sm" className="flex-1 max-md:h-11" onClick={() => { onChange(each.day); close(); }}>{each.label}</Button>
            ))}
          </div>
          <DateCalendar value={value} onChange={day => { onChange(day); close(); }} />
        </div>
      )}
    </PropertyPill>
  );
}

/** 양식의 한 부분: 작은 이름 아래 그 칸. */
/** 데스크톱 양식의 보이는 제목. 이것이 페이지의 h1이라 Page는 숨긴 h1을 두지 않는다. */
function ComposeTitle({ children }: { children: string }) {
  useOwnPageTitle();
  return <h1 className="text-2xl font-semibold">{children}</h1>;
}

function Part({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section aria-label={label} className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-muted-foreground">{label}</h2>
      {children}
    </section>
  );
}

/** 단계 표시: 지난 단계는 확인 표시, 지금 단계는 강조. 누르면 그 단계로 간다(값은 초안이 지킨다). */
function Steps({ current, onGo }: { current: number; onGo: (step: ComposeStep) => void }) {
  return (
    <ol aria-label="신청 단계" className="flex flex-wrap items-center gap-1">
      {steps.map((each, order) => (
        <li key={each.id} className="flex items-center gap-1">
          {order > 0 ? <span aria-hidden className="h-px w-4 bg-border" /> : null}
          <Button variant={order === current ? 'view-active' : 'view'} size="sm" aria-current={order === current ? 'step' : undefined}
            className="max-md:h-11 max-md:px-3" onClick={() => onGo(each.id)}>
            <span aria-hidden className={cn('grid size-4 place-items-center rounded-full text-[0.625rem] tabular-nums',
              order < current ? 'bg-primary text-primary-foreground' : order === current ? 'bg-foreground text-background' : 'ring-1 ring-border')}>
              {order < current ? <CheckIcon className="size-2.5" /> : order + 1}
            </span>
            {each.label}
          </Button>
        </li>
      ))}
    </ol>
  );
}

/**
 * 휴가 신청: 여러 사람의 결정이 걸린 신청이라 단계형이다(정보 → 결재선 → 확인). 단계는 주소의 step이 가지고 값은 라우터 위의 초안이
 * 가진다. 다음은 현재 단계만 검사하고 마지막 제출은 전체를 검사해 빠진 단계로 돌려보낸다. 바닥 줄에는 이전 · 취소 · 다음(제출)만
 * 두고, 남은 연차 같은 안내와 오류는 해당 칸 곁에 둔다. 쓴 것이 있으면 취소가 먼저 묻는다.
 */
export function RequestCompose({ step, onStep, onClose, onDone }: {
  step: ComposeStep; onStep: (step: ComposeStep) => void; onClose: () => void; onDone: (id: string) => void;
}) {
  const api = useApprovalApi();
  const client = useQueryClient();
  const isMobile = useIsMobile();
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
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const leave = () => { clearDraft(); onClose(); };
  const summary = draft.start && draft.end && !checked.dates
    ? `${range(draft.start, draft.end)} · 평일 ${checked.days}일${draft.kind === 'annual' ? ` · 사용 후 남는 연차 ${annualBalance - checked.days}일` : ''}`
    : `남은 연차 ${annualBalance}일`;
  const showDatesError = isTried && !!checked.dates;
  const showReasonError = isTried && !!checked.reason;
  const parts = step === 'info' ? <>
    <Part label="종류와 기간">
      <div role="group" aria-label="종류와 기간" className="flex flex-wrap items-center gap-1.5">
        <OptionPill label="종류" icon={FileTextIcon} value={draft.kind} options={leaveKinds.map(each => ({ value: each.id, label: each.label }))}
          onChange={kind => set({ kind })} />
        <DayPill label="시작일" value={draft.start} isInvalid={showDatesError} onChange={start => set({ start, end: draft.end ?? start })} />
        <DayPill label="종료일" value={draft.end} isInvalid={showDatesError} onChange={end => set({ end, start: draft.start ?? end })} />
      </div>
      {showDatesError
        ? <p role="alert" className="text-sm text-destructive">{checked.dates}</p>
        : <p className="text-sm text-muted-foreground tabular-nums">{summary}</p>}
    </Part>
    <Part label="사유">
      <Textarea aria-label="사유" rows={5} value={draft.reason} onChange={event => set({ reason: event.target.value })} aria-invalid={showReasonError || undefined}
        aria-describedby={showReasonError ? 'approval-reason-error' : undefined} placeholder="결재자가 판단할 수 있게 사유와 업무 인수인계를 적어 주세요."
        className="min-h-32 max-md:text-base" />
      {showReasonError ? <p id="approval-reason-error" role="alert" className="text-sm text-destructive">{checked.reason}</p> : null}
    </Part>
  </> : step === 'line' ? (
    <Part label="결재선">
      <p className="text-sm text-muted-foreground">위에서부터 차례로 결재합니다. 앞사람이 승인해야 다음 사람에게 넘어갑니다.</p>
      <LineEditor line={draft.line} onChange={line => set({ line })} error={isTried ? checked.line : undefined} />
    </Part>
  ) : <>
    <Part label="신청 내용">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-0.5 text-sm md:grid-cols-[6rem_minmax(0,1fr)] md:gap-y-2">
        <dt className="text-muted-foreground">종류</dt><dd className="max-md:mb-2">{leaveLabel(draft.kind)}</dd>
        <dt className="text-muted-foreground">기간</dt><dd className="max-md:mb-2">{draft.start && draft.end ? range(draft.start, draft.end) : '정하지 않음'}</dd>
        <dt className="text-muted-foreground">일수</dt><dd className="max-md:mb-2">{checked.days}일</dd>
        <dt className="text-muted-foreground">사유</dt><dd className="min-w-0 [overflow-wrap:anywhere]">{draft.reason.trim() || '비어 있음'}</dd>
      </dl>
      <div><Button variant="ghost" size="sm" className="max-md:h-11" onClick={() => go('info')}>정보 수정</Button></div>
    </Part>
    <Part label="결재선">
      <ol aria-label="결재 순서" className="flex flex-col border-t">
        {draft.line.map((person, order) => (
          <li key={person.approver} className={LINE_ROW}>
            <span aria-hidden className="w-5 shrink-0 text-center text-sm text-muted-foreground tabular-nums">{order + 1}</span>
            <PersonAvatar name={person.approver} className="size-6" />
            <span className="min-w-0 truncate">{person.approver} · {person.role}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted-foreground">{me}님이 제출하면 첫 번째 결재자에게 바로 전달됩니다.</p>
      <div><Button variant="ghost" size="sm" className="max-md:h-11" onClick={() => go('line')}>결재선 수정</Button></div>
    </Part>
  </>;
  return (
    <ComposeSurface surface="page" crumbs={[{ label: '내 신청', href: '/requests', icon: FileTextIcon }, { label: '휴가 신청' }]}
      onClose={leave} isDirty={isDirty}
      discard={{ title: '작성 중인 신청을 버릴까요?', description: '지금 나가면 입력한 기간 · 사유 · 결재선이 사라집니다.', label: '버리고 나가기' }}
      actions={step === 'info' ? undefined : <Button variant="ghost" onClick={() => go(steps[index - 1].id)}>이전</Button>}
      error={save.isError ? '제출하지 못했습니다. 입력한 내용은 그대로 있습니다.' : undefined}
      submit={{ label: step === 'review' ? '제출' : '다음', isPending: save.isPending, onSubmit: submit }}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          {/* 휴대폰은 앱 바가 이름(h1)을 보인다. 데스크톱은 이 제목이 페이지의 h1이다. */}
          {isMobile ? null : <ComposeTitle>휴가 신청</ComposeTitle>}
          <Steps current={index} onGo={go} />
        </div>
        {parts}
      </div>
    </ComposeSurface>
  );
}
