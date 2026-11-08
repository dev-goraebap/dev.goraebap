import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Heading } from '@astryxdesign/core/Heading';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { icon, type IconName } from '@kit/foundations/icons/solar-icon';
import styles from '../../app/onboarding.module.css';

function Choice({ title, description, mark, isBusy = false, onClick }: {
  title: string; description: string; mark: IconName; isBusy?: boolean; onClick: () => void;
}) {
  return <ClickableCard label={title} padding={5} className={styles.choice} onClick={isBusy ? undefined : onClick}>
    <VStack gap={3} hAlign="start">
      <span className={styles.mark}>{isBusy ? <Spinner label={`${title} 진행 중`} /> : icon(mark)}</span>
      <VStack gap={1}>
        <Text weight="semibold">{title}</Text>
        <Text color="secondary">{description}</Text>
      </VStack>
    </VStack>
  </ClickableCard>;
}

/**
 * 아무것도 없는 작업 공간의 첫 화면. 빈 목록 그림 대신 처음 할 수 있는 일을 큰 선택지 셋으로 놓는다. 선택하면 곧바로
 * 그 일이 시작된다(대화상자를 열거나 견본을 채운다).
 */
export function FirstRun({ isFilling, onCreate, onSample, onInvite }: {
  isFilling: boolean; onCreate: () => void; onSample: () => void; onInvite: () => void;
}) {
  return <VStack className={styles.first} gap={6}>
    <Heading level={2}>무엇부터 시작할까요?</Heading>
    <div className={styles.choices}>
      <Choice title="프로젝트 만들기" description="이름만 정하면 바로 시작합니다." mark="plus" onClick={onCreate} />
      <Choice title="견본으로 시작" description="채워진 프로젝트를 둘러보고 필요 없으면 되돌립니다." mark="layout-list" isBusy={isFilling} onClick={onSample} />
      <Choice title="팀원 초대" description="함께 쓸 사람을 이메일로 초대합니다." mark="people" onClick={onInvite} />
    </div>
  </VStack>;
}
