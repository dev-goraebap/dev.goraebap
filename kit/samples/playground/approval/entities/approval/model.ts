export type LeaveKind = 'annual' | 'sick' | 'family';
export const leaveKinds: { id: LeaveKind; label: string }[] = [
  { id: 'annual', label: '연차' },
  { id: 'sick', label: '병가' },
  { id: 'family', label: '경조사 휴가' },
];
export const leaveLabel = (id: LeaveKind) => leaveKinds.find(each => each.id === id)!.label;

/** 결재선의 한 사람. pending은 아직 결정하지 않은 것(지금 차례이거나 앞사람을 기다리는 중). */
export type Decision = { approver: string; role: string; state: 'pending' | 'approved' | 'rejected'; at?: string; opinion?: string };
export type Approval = {
  /** 문서 번호(AP-5). 주소에도 쓴다. */
  id: string;
  kind: LeaveKind;
  applicant: string;
  /** 시작일·종료일(YYYY-MM-DD, 종료일 포함). */
  start: string;
  end: string;
  reason: string;
  /** 결재선. 위에서부터 차례로 결재한다. */
  line: Decision[];
  createdAt: string;
};
export type LinePerson = { approver: string; role: string };
export type NewApproval = { kind: LeaveKind; start: string; end: string; reason: string; line: LinePerson[] };
export type DecisionResult = 'approved' | 'rejected';

/** 이 앱을 쓰는 사람과 견본의 오늘, 남은 연차(가짜 값). */
export const me = '서윤';
export const today = '2026-11-08';
export const annualBalance = 12;

/** 결재자로 고를 수 있는 사람. 이름으로 찾는다. */
export const directory: LinePerson[] = [
  { approver: '지우', role: '팀장' },
  { approver: '도현', role: '본부장' },
  { approver: '민준', role: '선임' },
  { approver: '하은', role: '인사 담당' },
  { approver: '지민', role: '재무 담당' },
  { approver: '예린', role: '기획 팀장' },
  { approver: '준호', role: '운영 팀장' },
  { approver: '서현', role: '총무 담당' },
  { approver: '태윤', role: '보안 담당' },
  { approver: '수아', role: '디자인 팀장' },
];
/** 신청자의 기본 결재선. 새 신청은 이 줄로 시작하고 고칠 수 있다. */
export const defaultLine: LinePerson[] = [directory[0], directory[1]];

export type Result = 'progress' | 'approved' | 'rejected';
export const resultLabel: Record<Result, string> = { progress: '진행 중', approved: '승인', rejected: '반려' };

export function resultOf(approval: Pick<Approval, 'line'>): Result {
  if (approval.line.some(each => each.state === 'rejected')) return 'rejected';
  return approval.line.every(each => each.state === 'approved') ? 'approved' : 'progress';
}

/** 지금 결재할 차례의 사람. 반려되었거나 모두 끝났으면 없다. */
export function currentOf(approval: Pick<Approval, 'line'>): Decision | undefined {
  return resultOf(approval) === 'progress' ? approval.line.find(each => each.state === 'pending') : undefined;
}

/** 줄 안에서 보이는 상태: 반려 뒤의 대기는 건너뜀이다. */
export function stepStateOf(approval: Pick<Approval, 'line'>, index: number): 'approved' | 'rejected' | 'current' | 'waiting' | 'skipped' {
  const decision = approval.line[index];
  if (decision.state !== 'pending') return decision.state;
  if (resultOf(approval) === 'rejected') return 'skipped';
  return currentOf(approval) === decision ? 'current' : 'waiting';
}

const utc = (day: string) => new Date(`${day}T00:00:00Z`);

/** 시작일부터 종료일까지의 평일 수. 종료일이 앞서면 0. */
export function weekdays(start: string, end: string): number {
  let count = 0;
  for (let time = utc(start).getTime(); time <= utc(end).getTime(); time += 86_400_000) {
    const day = new Date(time).getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
}

const day = new Intl.DateTimeFormat('ko', { month: 'long', day: 'numeric', timeZone: 'UTC' });
const dayWeek = new Intl.DateTimeFormat('ko', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'UTC' });
export const dayText = (value: string) => day.format(utc(value.slice(0, 10)));
export const dayWeekText = (value: string) => dayWeek.format(utc(value));
export const rangeText = (start: string, end: string) => start === end ? dayText(start) : `${dayText(start)} – ${new Intl.DateTimeFormat('ko', { day: 'numeric', timeZone: 'UTC' }).format(utc(end))}`;
export const timeText = (value: string) =>
  new Intl.DateTimeFormat('ko', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(value));

export const titleOf = (approval: Pick<Approval, 'kind' | 'start' | 'end'>) => `${leaveLabel(approval.kind)} ${rangeText(approval.start, approval.end)}`;
export const daysOf = (approval: Pick<Approval, 'start' | 'end'>) => weekdays(approval.start, approval.end);
