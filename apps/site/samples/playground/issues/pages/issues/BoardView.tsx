import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { statuses, type Issue } from '../../entities/issue';
import { IssueCard, StatusMark } from '../../entities/issue/ui';
import styles from './issues.module.css';

/**
 * 보드: 상태마다 한 칸. 칸 머리는 상태와 개수, 카드는 칸 안에서 현재 정렬 순서를 따른다. 보드 안에서만 가로로 넘기고 키보드는
 * 보드 영역으로 초점을 받아 방향키로 넘긴다. 이슈가 없는 칸도 그대로 두어 어느 상태에 몇 건인지 한눈에 보이게 한다.
 */
export function BoardView({ items }: { items: Issue[] }) {
  return <div className={styles.scroll} role="region" aria-label="상태별 보드" tabIndex={0}>
    <div className={styles.board}>
      {statuses.map(status => {
        const rows = items.filter(item => item.status === status.id);
        return <section key={status.id} className={styles.column} aria-label={status.label}>
          <HStack className={styles.head} gap={2} vAlign="center" hAlign="between">
            <StatusMark status={status.id} />
            <Text type="supporting" color="secondary" hasTabularNumbers>{rows.length}</Text>
          </HStack>
          {rows.length ? <VStack gap={2}>{rows.map(issue => <IssueCard key={issue.id} issue={issue} />)}</VStack>
            : <Text className={styles.none} type="supporting" color="secondary">이슈가 없습니다</Text>}
        </section>;
      })}
    </div>
  </div>;
}
