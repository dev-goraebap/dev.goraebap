import { PersonAvatar as Avatar } from '@/shared/ui/foundations/avatar/PersonAvatar';
import { HStack } from '@astryxdesign/core/HStack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Step, Stepper } from '@astryxdesign/core/Stepper';
import { Text } from '@astryxdesign/core/Text';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { stepStateOf, timeText, resultOf, type Approval, type Result } from './model';
import styles from './approval.module.css';

const dots: Record<Result, 'accent' | 'success' | 'error'> = { progress: 'accent', approved: 'success', rejected: 'error' };
const labels: Record<Result, string> = { progress: '진행 중', approved: '승인', rejected: '반려' };

/** 문서의 결과: 색 점과 이름. 점은 장식이라 이름만 읽힌다. */
export function ResultMark({ approval }: { approval: Pick<Approval, 'line'> }) {
  const result = resultOf(approval);
  return <HStack gap={1.5} vAlign="center">
    <span aria-hidden="true"><StatusDot variant={dots[result]} label={labels[result]} /></span>
    <Text type="supporting" textWrap="nowrap">{labels[result]}</Text>
  </HStack>;
}

/** 사람은 사진과 이름을 함께 둔다. */
export function Person({ name, role }: { name: string; role?: string }) {
  return <HStack gap={1.5} vAlign="center"><Avatar name={name} size="xsm" shape="circle" /><Text type="supporting" maxLines={1}>{role ? `${name} · ${role}` : name}</Text></HStack>;
}

const stateText = { approved: '승인', rejected: '반려', current: '지금 결재할 차례', waiting: '대기', skipped: '건너뜀' } as const;

/**
 * 진행 상태 타임라인: 신청 → 결재선 순서. 승인한 단계는 완료 표시와 시각, 반려한 단계는 붉은 표시와 이유, 지금 차례는 진행
 * 표시, 뒤의 사람은 대기, 반려 뒤에는 건너뜀. 의견은 그 단계 아래에 보인다. 상태는 색만이 아니라 글자로도 적는다.
 */
export function Timeline({ approval }: { approval: Approval }) {
  const states = approval.line.map((_, index) => stepStateOf(approval, index));
  const active = states.findIndex(state => state === 'current' || state === 'rejected');
  // 앞의 신청 단계가 0번이라 결재선은 1부터. 모두 끝났으면 전부 완료로 보인다.
  const activeStep = active === -1 ? approval.line.length + 1 : active + 1;
  return <Stepper orientation="vertical" activeStep={activeStep} label="결재 진행 상태" density="compact">
    <Step step={0} label={`${approval.applicant} · 신청`} status="success" endContent={<Text type="supporting" color="secondary" hasTabularNumbers>{timeText(approval.createdAt)}</Text>} />
    {approval.line.map((decision, index) => {
      const state = states[index];
      return <Step key={decision.approver} step={index + 1} label={`${decision.approver} · ${decision.role}`} description={stateText[state]}
        status={state === 'approved' ? 'success' : state === 'rejected' ? 'error' : undefined}
        indicator={state === 'rejected' ? <span className={styles.rejected}>{icon('close')}</span> : state === 'skipped' ? 'none' : 'auto'}
        endContent={decision.at ? <Text type="supporting" color="secondary" hasTabularNumbers>{timeText(decision.at)}</Text> : undefined}>
        {decision.opinion ? <Text className={styles.opinion}>{decision.opinion}</Text> : null}
      </Step>;
    })}
  </Stepper>;
}
