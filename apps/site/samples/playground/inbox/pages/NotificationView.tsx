import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { kinds, timeText, type Notification } from '../entities/notification';
import styles from './inbox.module.css';

/**
 * 알림의 내용: 무엇이 왔는지(종류·시각·제목·본문), 가리키는 대상, 보관 동작. 목록 옆 상세 칸과 자기 페이지가 같은 부품을
 * 쓴다. 휴대폰과 직접 진입은 페이지로, 데스크톱 목록은 상세 칸으로 보인다.
 */
export function NotificationView({ item, headingLevel = 1, isBusy, onToggleArchive }: {
  item: Notification; headingLevel?: 1 | 2; isBusy: boolean; onToggleArchive: () => void;
}) {
  return <VStack className={styles.view} gap={4}>
    <VStack gap={2}>
      <HStack gap={2} vAlign="center">
        <Token label={kinds[item.kind].label} size="sm" />
        <Text type="supporting" color="secondary" hasTabularNumbers>{timeText(item.sentAt)}</Text>
      </HStack>
      <Heading level={headingLevel}>{item.title}</Heading>
    </VStack>
    <Text>{item.body}</Text>
    <section aria-label="알림이 가리키는 내용" className={styles.target}>
      <HStack gap={2} vAlign="center">{icon('document')}<Text weight="semibold" maxLines={1}>{item.subject}</Text></HStack>
      <Text color="secondary">{item.excerpt}</Text>
    </section>
    <HStack>
      <Button label={item.archived ? '받은함으로 옮기기' : '보관하기'} variant="secondary" icon={icon(item.archived ? 'restore' : 'archive')}
        isLoading={isBusy} onClick={onToggleArchive} />
    </HStack>
  </VStack>;
}
