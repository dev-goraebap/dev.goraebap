import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { TextInput } from '@astryxdesign/core/TextInput';
import { useRef, useState } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { useIsPhone, useToolSize } from '../../foundations/media';
import styles from './search.module.css';

/**
 * 페이지 툴바의 검색: 필터·표시와 같은 둥근 도구가 그 자리에서 같은 높이의 칸으로 열린다. 닫기 버튼과 Esc로 접고
 * 바깥 클릭으로는 접지 않는다. 지우기(칸 안의 ×)와 접기는 별도 동작이며, 접어도 검색어를 유지하고 도구에 점을 둔다.
 * 접으면 초점은 도구로 돌아간다. 검색어가 있는 채로 들어오면 열린 상태로 시작한다.
 */
export function SearchTool({ label, placeholder, value, onChange }: {
  label: string; placeholder?: string; value: string; onChange: (value: string) => void;
}) {
  const size = useToolSize();
  const isPhone = useIsPhone();
  const [isOpen, setOpen] = useState(!!value);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); };
  if (isOpen) {
    return (
      <HStack gap={1} vAlign="center" className={styles.search}>
        <TextInput label={label} isLabelHidden size={size} width={isPhone ? 'min(14rem, 40vw)' : '14rem'}
          controlClassName={styles.input} startIcon={icon('search')} hasClear hasAutoFocus={!value}
          placeholder={placeholder} value={value} onChange={onChange}
          onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); close(); } }} />
        <Button label={`${label} 닫기`} tooltip="검색 닫기" variant="subtle" size={size} isIconOnly icon={icon('close')} onClick={close} />
      </HStack>
    );
  }
  return <HStack className={styles.trigger}>
    <Button ref={trigger} label={value ? `${label}, 검색 중` : label} tooltip={label} variant={value ? 'view-active' : 'tool'} size={size} isIconOnly
      icon={icon('search', !!value)} onClick={() => setOpen(true)} />
    {value ? <StatusDot className={styles.dot} variant="accent" label="검색 중" /> : null}
  </HStack>;
}
