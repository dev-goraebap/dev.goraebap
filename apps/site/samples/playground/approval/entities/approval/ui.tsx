import type { ReactNode } from 'react';
import { cn } from 'cn';
import { CheckIcon, XIcon } from '@/shared/ui/icon';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { resultLabel, resultOf, stepStateOf, timeText, type Approval, type Result } from './model';

const dots: Record<Result, string> = { progress: 'bg-mark-progress', approved: 'bg-mark-done', rejected: 'bg-destructive' };

/** 문서의 결과: 색 점과 이름. 점은 장식이라 이름만 읽힌다. */
export function ResultMark({ approval }: { approval: Pick<Approval, 'line'> }) {
  const result = resultOf(approval);
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground">
      <span aria-hidden className={cn('size-2 rounded-full', dots[result])} />
      {resultLabel[result]}
    </span>
  );
}

/** 사람은 사진과 이름을 함께 둔다. */
export function Person({ name, role }: { name: string; role?: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <PersonAvatar name={name} className="size-4" />
      <span className="truncate">{role ? `${name} · ${role}` : name}</span>
    </span>
  );
}

const stateText = { approved: '승인', rejected: '반려', current: '지금 결재할 차례', waiting: '대기', skipped: '건너뜀' } as const;
type StepState = keyof typeof stateText | 'applied';

/** 단계 표식: 승인·신청은 채운 확인, 반려는 붉은 ×, 지금 차례는 강조 고리, 대기는 빈 원, 건너뜀은 점선 원. */
function Marker({ state }: { state: StepState }) {
  const base = 'relative z-1 grid size-5 shrink-0 place-items-center rounded-full [&_svg]:size-3';
  if (state === 'approved' || state === 'applied') return <span aria-hidden className={cn(base, 'bg-primary text-primary-foreground')}><CheckIcon /></span>;
  if (state === 'rejected') return <span aria-hidden className={cn(base, 'bg-destructive text-background')}><XIcon /></span>;
  if (state === 'current') return <span aria-hidden className={cn(base, 'bg-background ring-2 ring-primary ring-inset')}><span className="size-2 rounded-full bg-primary" /></span>;
  return <span aria-hidden className={cn(base, 'bg-background', state === 'skipped' ? 'border border-dashed border-muted-foreground/50' : 'ring-[1.5px] ring-muted-foreground/45 ring-inset')} />;
}

function Step({ state, label, at, children }: { state: StepState; label: string; at?: string; children?: ReactNode }) {
  return (
    <li aria-current={state === 'current' ? 'step' : undefined}
      className="relative flex gap-3 pb-4 last:pb-0 before:absolute before:top-5 before:bottom-0 before:left-2.5 before:w-px before:-translate-x-1/2 before:bg-border last:before:hidden">
      <Marker state={state} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className={cn('min-w-0 flex-1 truncate text-sm font-medium', state === 'skipped' && 'text-muted-foreground')}>{label}</span>
          {at ? <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{timeText(at)}</span> : null}
        </div>
        {state === 'applied' ? null : <span className={cn('text-xs', state === 'rejected' ? 'text-destructive' : 'text-muted-foreground')}>{stateText[state]}</span>}
        {children}
      </div>
    </li>
  );
}

/**
 * 진행 상태 타임라인: 신청 → 결재선 순서. 승인한 단계는 완료 표시와 시각, 반려한 단계는 붉은 표시와 이유, 지금 차례는 강조 고리,
 * 뒤의 사람은 대기, 반려 뒤에는 건너뜀. 의견은 그 단계 아래에 보인다. 상태는 색만이 아니라 글자로도 적는다.
 */
export function Timeline({ approval }: { approval: Approval }) {
  return (
    <ol aria-label="결재 진행 상태" className="flex flex-col">
      <Step state="applied" label={`${approval.applicant} · 신청`} at={approval.createdAt} />
      {approval.line.map((decision, index) => (
        <Step key={decision.approver} state={stepStateOf(approval, index)} label={`${decision.approver} · ${decision.role}`} at={decision.at}>
          {decision.opinion ? <p className="pt-1 text-sm [overflow-wrap:anywhere]">{decision.opinion}</p> : null}
        </Step>
      ))}
    </ol>
  );
}
