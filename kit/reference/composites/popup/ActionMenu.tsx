import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { icon, type IconName } from '../../foundations/icons/solar-icon';
import styles from './popup.module.css';

export type MenuAction = { id: string; label: string; icon?: IconName; isChosen?: boolean; isDisabled?: boolean; onSelect?: () => void };

/**
 * 팝오버나 바텀시트에 담는 짧은 동작·선택 목록. 아이콘과 이름, 고른 항목 끝의 체크. 메뉴 행은 페이지 행(16px)보다 좁은
 * 8px 안쪽이다. 고른 뒤 onDone으로 담은 것을 닫는다.
 */
export function ActionMenu({ title, actions, onDone }: { title?: string; actions: MenuAction[]; onDone?: () => void }) {
  return <List density="balanced" header={title ? <Text type="supporting" color="secondary" weight="medium">{title}</Text> : undefined}>
    {actions.map(action => <ListItem key={action.id} label={action.label} className={styles.row} isDisabled={action.isDisabled}
      isSelected={action.isChosen}
      startContent={action.icon ? icon(action.icon, action.isChosen) : undefined}
      endContent={action.isChosen ? icon('check') : undefined}
      onClick={() => { action.onSelect?.(); onDone?.(); }} />)}
  </List>;
}
