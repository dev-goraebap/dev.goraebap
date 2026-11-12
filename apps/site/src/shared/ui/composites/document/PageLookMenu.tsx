import { Button } from '@astryxdesign/core/Button';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useState } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { AdaptivePopover } from '../popup/AdaptivePopover';
import type { PageLook } from './model';
import styles from './document.module.css';


const STYLE_HINTS: Record<PageLook['style'], string> = {
  tinted: '페이지 바깥을 테마에 맞춰 옅게 다른 색으로 두어 페이지를 가릅니다.',
  divider: '같은 바탕에 페이지 사이에만 가로선을 둡니다.',
};

/** 페이지 모양 고르기: 보기 전환 옆의 단추와 그 아래 칸. 편집과 읽기가 함께 쓴다. */
export function PageLookMenu({ value, onChange }: { value: PageLook; onChange: (look: PageLook) => void }) {
  const [isOpen, setOpen] = useState(false);
  return <AdaptivePopover label="페이지 모양" width="18rem" alignment="end" onOpenChange={setOpen}
    trigger={<Button label="페이지 모양" variant="ghost" size="sm" isIconOnly icon={icon('layout-grid')} aria-pressed={isOpen} />}
    content={() => <VStack className={styles.lookMenu} gap={3}>
      <SegmentedControl label="모양" size="sm" layout="fill" value={value.style} onChange={style => onChange({ ...value, style: style as PageLook['style'] })}>
        <SegmentedControlItem value="tinted" label="연한 바탕" />
        <SegmentedControlItem value="divider" label="구분선" />
      </SegmentedControl>
      <Text type="supporting" color="secondary">{STYLE_HINTS[value.style]}</Text>
      {value.style === 'divider' ? <SegmentedControl label="선 모양" size="sm" layout="fill" value={value.line} onChange={line => onChange({ ...value, line: line as PageLook['line'] })}>
        <SegmentedControlItem value="solid" label="실선" />
        <SegmentedControlItem value="dashed" label="점선" />
        <SegmentedControlItem value="dotted" label="점" />
        <SegmentedControlItem value="wavy" label="물결" />
      </SegmentedControl> : null}
    </VStack>} />;
}
