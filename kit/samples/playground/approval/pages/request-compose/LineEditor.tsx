import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { OptionList } from '@kit/composites/filter/OptionList';
import { AdaptivePopover } from '@kit/composites/popup/AdaptivePopover';
import { icon } from '@kit/foundations/icons/solar-icon';
import { useIsPhone } from '@kit/foundations/media';
import { directory, me, type LinePerson } from '../../entities/approval';
import styles from './compose.module.css';

/**
 * 결재선 고르기: 맨 위에 신청자(빼거나 옮길 수 없다), 아래로 결재자를 차례대로. 순서는 위·아래 버튼으로 바꾸고 빼기로 지운다.
 * 결재자는 이름으로 찾아 더한다(이미 있는 사람과 신청자는 고르는 목록에서 뺀다). 한 명도 없으면 error를 추가 버튼 곁에 알린다.
 */
export function LineEditor({ line, onChange, error }: { line: LinePerson[]; onChange: (line: LinePerson[]) => void; error?: string }) {
  const isPhone = useIsPhone();
  const move = (index: number, by: -1 | 1) => {
    const next = [...line];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  };
  const candidates = directory.filter(each => each.approver !== me && !line.some(person => person.approver === each.approver));
  return <VStack gap={3}>
    <ol className={styles.line} aria-label="결재선">
      <li className={styles.person}>
        <span className={styles.order} aria-hidden="true">{icon('user')}</span>
        <Avatar name={me} size="sm" shape="circle" />
        <VStack className={styles.name}><Text weight="medium" maxLines={1}>{me}</Text><Text type="supporting" color="secondary">신청자</Text></VStack>
      </li>
      {line.map((person, index) => <li key={person.approver} className={styles.person}>
        <Text className={styles.order} type="supporting" color="secondary" hasTabularNumbers aria-hidden="true">{index + 1}</Text>
        <Avatar name={person.approver} size="sm" shape="circle" />
        <VStack className={styles.name}><Text weight="medium" maxLines={1}>{person.approver}</Text><Text type="supporting" color="secondary" maxLines={1}>{person.role}</Text></VStack>
        <HStack gap={0.5} className={styles.tools}>
          <IconButton label={`${person.approver} 위로`} tooltip="위로" variant="ghost" size="sm" isDisabled={index === 0}
            icon={<span className={styles.up}>{icon('chevron-down')}</span>} onClick={() => move(index, -1)} />
          <IconButton label={`${person.approver} 아래로`} tooltip="아래로" variant="ghost" size="sm" isDisabled={index === line.length - 1}
            icon={icon('chevron-down')} onClick={() => move(index, 1)} />
          <IconButton label={`${person.approver} 빼기`} tooltip="빼기" variant="ghost" size="sm" icon={icon('close')}
            onClick={() => onChange(line.filter(each => each.approver !== person.approver))} />
        </HStack>
      </li>)}
    </ol>
    <HStack gap={3} vAlign="center" wrap="wrap" data-invalid-field={error ? '' : undefined}>
      <AdaptivePopover label="결재자 추가" width="18rem" sheetHeight="tall"
        trigger={<Button label="결재자 추가" variant="secondary" size="sm" icon={icon('plus')} />}
        content={close => candidates.length
          ? <OptionList label="결재자 고르기" isSearchable size={isPhone ? 'lg' : 'sm'}
            options={candidates.map(each => ({ value: each.approver, label: `${each.approver} · ${each.role}`, icon: <Avatar name={each.approver} size="xsm" shape="circle" /> }))}
            onPick={name => { const picked = candidates.find(each => each.approver === name); if (picked) onChange([...line, picked]); close(); }} />
          : <Text color="secondary">더할 수 있는 사람이 없습니다.</Text>} />
      {error ? <Text className={styles.error} type="supporting" role="alert">{error}</Text> : null}
    </HStack>
  </VStack>;
}
