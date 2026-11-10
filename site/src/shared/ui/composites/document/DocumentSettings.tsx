import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Selector } from '@astryxdesign/core/Selector';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { useEffect, useRef, type ReactNode } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { PAPERS, type Paper, type PageSetup } from './model';
import type { PageArea } from './PageCanvas';
import styles from './document.module.css';

export type SettingsTab = 'document' | 'headerFooter';
type Slot = { area: PageArea; side: 'left' | 'center' | 'right' };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <VStack as="section" className={styles.settingsSection} gap={3} aria-label={title}>
    <Text weight="semibold">{title}</Text>
    {children}
  </VStack>;
}

/**
 * 문서 설정 칸(편집기 오른쪽). 문서 탭은 용지·방향·여백·페이지 간격, 머리말·바닥글 탭은 첫 페이지 다르게, 머리말(왼쪽·오른쪽)·
 * 바닥글(왼쪽·가운데·오른쪽) 글과 가장자리 거리, 페이지 번호·전체 페이지 넣기다. 바꾸면 그 자리에서 다시 나눈다(저장은 호스트가 한다).
 * focus는 종이의 머리말·바닥글을 두 번 눌렀을 때 그 칸으로 커서를 옮긴다.
 */
export function DocumentSettings({ setup, onChange, tab, onTab, focus, onClose }: {
  setup: PageSetup; onChange: (setup: PageSetup) => void; tab: SettingsTab; onTab: (tab: SettingsTab) => void;
  focus?: PageArea | null; onClose: () => void;
}) {
  const last = useRef<Slot>({ area: 'footer', side: 'right' });
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const keyOf = (slot: Slot) => `${slot.area}-${slot.side}`;
  useEffect(() => {
    if (!focus || tab !== 'headerFooter') return;
    const slot: Slot = { area: focus, side: 'left' };
    last.current = slot;
    inputs.current.get(keyOf(slot))?.focus();
  }, [focus, tab]);
  const set = (patch: Partial<PageSetup>) => onChange({ ...setup, ...patch });
  const margin = (side: keyof PageSetup['margins']) => <NumberInput label={{ top: '위', bottom: '아래', left: '왼쪽', right: '오른쪽' }[side]} size="sm" units="mm"
    min={0} max={60} step={1} value={setup.margins[side]} onChange={value => set({ margins: { ...setup.margins, [side]: value } })} />;
  const text = (slot: Slot, label: string) => {
    const value = slot.area === 'header' ? setup.header[slot.side as 'left' | 'right'] : setup.footer[slot.side];
    return <TextInput label={label} size="sm" value={value} placeholder="비어 있음"
      ref={(element: HTMLInputElement | null) => { if (element) inputs.current.set(keyOf(slot), element); else inputs.current.delete(keyOf(slot)); }}
      onFocus={() => { last.current = slot; }}
      onChange={next => slot.area === 'header' ? set({ header: { ...setup.header, [slot.side]: next } }) : set({ footer: { ...setup.footer, [slot.side]: next } })} />;
  };
  // 페이지 번호·전체 페이지는 마지막으로 고르던 칸의 끝에 넣는다.
  const insertToken = (token: string) => {
    const slot = last.current, current = slot.area === 'header' ? setup.header[slot.side as 'left' | 'right'] : setup.footer[slot.side];
    const next = `${current}${current && !current.endsWith(' ') ? ' ' : ''}${token}`;
    if (slot.area === 'header') set({ header: { ...setup.header, [slot.side]: next } }); else set({ footer: { ...setup.footer, [slot.side]: next } });
    requestAnimationFrame(() => inputs.current.get(keyOf(slot))?.focus());
  };
  return <VStack as="aside" className={styles.settings} aria-label="문서 설정">
    <HStack className={styles.settingsHead} gap={2} vAlign="center" hAlign="between">
      <SegmentedControl label="설정 묶음" size="sm" value={tab} onChange={value => onTab(value as SettingsTab)}>
        <SegmentedControlItem value="document" label="문서" />
        <SegmentedControlItem value="headerFooter" label="머리말 · 바닥글" />
      </SegmentedControl>
      <Button label="문서 설정 닫기" tooltip="닫기" variant="ghost" size="sm" isIconOnly icon={icon('close')} onClick={onClose} />
    </HStack>
    <VStack className={styles.settingsBody}>
      {tab === 'document' ? <>
        <Section title="용지">
          <HStack gap={2}>
            <Selector label="용지 크기" size="sm" value={setup.paper} onChange={value => set({ paper: value as Paper })}
              options={(Object.keys(PAPERS) as Paper[]).map(paper => ({ value: paper, label: `${paper} (${PAPERS[paper].width} × ${PAPERS[paper].height}mm)` }))} />
          </HStack>
          <SegmentedControl label="방향" size="sm" value={setup.orientation} onChange={value => set({ orientation: value as PageSetup['orientation'] })} layout="fill">
            <SegmentedControlItem value="portrait" label="세로" />
            <SegmentedControlItem value="landscape" label="가로" />
          </SegmentedControl>
        </Section>
        <Section title="여백">
          <HStack gap={2} className={styles.settingsPair}>{margin('top')}{margin('bottom')}</HStack>
          <HStack gap={2} className={styles.settingsPair}>{margin('left')}{margin('right')}</HStack>
        </Section>
        <Section title="화면">
          <NumberInput label="페이지 사이 간격" size="sm" units="px" min={0} max={80} step={4} value={setup.gap} onChange={value => set({ gap: value })} />
        </Section>
      </> : <>
        <Section title="배치">
          <Switch label="첫 페이지 다르게" description="표지처럼 첫 페이지에는 머리말·바닥글을 두지 않습니다." value={setup.differentFirstPage}
            onChange={value => set({ differentFirstPage: value })} />
        </Section>
        <Section title="머리말">
          <HStack gap={2} className={styles.settingsPair}>{text({ area: 'header', side: 'left' }, '왼쪽')}{text({ area: 'header', side: 'right' }, '오른쪽')}</HStack>
          <NumberInput label="위 가장자리에서" size="sm" units="mm" min={0} max={40} step={1} value={setup.headerDistance} onChange={value => set({ headerDistance: value })} />
        </Section>
        <Section title="바닥글">
          <HStack gap={2} className={styles.settingsPair}>{text({ area: 'footer', side: 'left' }, '왼쪽')}{text({ area: 'footer', side: 'center' }, '가운데')}</HStack>
          {text({ area: 'footer', side: 'right' }, '오른쪽')}
          <NumberInput label="아래 가장자리에서" size="sm" units="mm" min={0} max={40} step={1} value={setup.footerDistance} onChange={value => set({ footerDistance: value })} />
        </Section>
        <Section title="페이지 번호">
          <Text type="supporting" color="secondary">마지막으로 고르던 칸의 끝에 넣습니다.</Text>
          <HStack gap={2} wrap="wrap">
            <Button label="페이지 번호 넣기" variant="secondary" size="sm" onMouseDown={event => event.preventDefault()} onClick={() => insertToken('{page}')} />
            <Button label="전체 페이지 넣기" variant="secondary" size="sm" onMouseDown={event => event.preventDefault()} onClick={() => insertToken('{total}')} />
          </HStack>
        </Section>
      </>}
    </VStack>
  </VStack>;
}
