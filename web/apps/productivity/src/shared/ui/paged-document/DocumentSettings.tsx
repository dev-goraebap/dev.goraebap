import { useEffect, useId, useRef } from 'react';
import { Button } from '@goraebap/ui-react/compact/button';
import { Field, FieldDescription, FieldLabel } from '@goraebap/ui-react/components/field';
import { XIcon } from '@/shared/ui/kit/icon';
import { SegmentedControl } from '@/shared/ui/kit/segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@goraebap/ui-react/compact/select';
import { Switch } from '@goraebap/ui-react/components/switch';
import { DocumentNumberField } from './DocumentNumberField';
import { DocumentSettingsSection } from './DocumentSettingsSection';
import { DocumentTextField } from './DocumentTextField';
import { DEFAULT_PAGE_SETUP, PAPERS, type Paper, type PageSetup } from './model';
import type { PageArea } from './PageCanvas';

export type SettingsTab = 'document' | 'headerFooter';
type Slot = { area: PageArea; side: 'left' | 'center' | 'right' };

/**
 * 페이지 설정 칸(PDF 미리보기 오른쪽). 문서 탭은 용지·방향·여백, 머리말·바닥글 탭은 첫 페이지 다르게, 머리말(왼쪽·오른쪽)·
 * 바닥글(왼쪽·가운데·오른쪽) 글과 가장자리 거리, 페이지 번호·전체 페이지 넣기다. 바꾸면 그 자리에서 다시 나눈다(저장은 호스트가 한다).
 * focus는 종이의 머리말·바닥글을 두 번 눌렀을 때 그 칸으로 커서를 옮긴다. 놓인 자리(오른쪽 칸)를 위아래 · 좌우 끝까지 채운다.
 * 모양은 키트의 문서 설정 칸(shared/ui/document)과 같다. 화면용 페이지 사이 간격은 PDF 미리보기가 정하므로 두지 않는다.
 */
export function DocumentSettings({ setup, onChange, tab, onTab, focus, onClose }: {
  setup: PageSetup; onChange: (setup: PageSetup) => void; tab: SettingsTab; onTab: (tab: SettingsTab) => void;
  focus?: PageArea | null; onClose: () => void;
}) {
  const last = useRef<Slot>({ area: 'footer', side: 'right' });
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const switchId = useId();
  const keyOf = (slot: Slot) => `${slot.area}-${slot.side}`;
  useEffect(() => {
    if (!focus || tab !== 'headerFooter') return;
    const slot: Slot = { area: focus, side: 'left' };
    last.current = slot;
    inputs.current.get(keyOf(slot))?.focus();
  }, [focus, tab]);
  const set = (patch: Partial<PageSetup>) => onChange({ ...setup, ...patch });
  const margin = (side: keyof PageSetup['margins']) => <DocumentNumberField label={{ top: '위', bottom: '아래', left: '왼쪽', right: '오른쪽' }[side]} unit="mm"
    min={0} max={60} placeholder={DEFAULT_PAGE_SETUP.margins[side]} value={setup.margins[side]} onChange={value => set({ margins: { ...setup.margins, [side]: value } })} />;
  const read = (slot: Slot) => slot.area === 'header' ? setup.header[slot.side as 'left' | 'right'] : setup.footer[slot.side];
  const write = (slot: Slot, next: string) => slot.area === 'header' ? set({ header: { ...setup.header, [slot.side]: next } }) : set({ footer: { ...setup.footer, [slot.side]: next } });
  const text = (slot: Slot, label: string) => <DocumentTextField label={label} value={read(slot)} onFocus={() => { last.current = slot; }} onChange={next => write(slot, next)}
    inputRef={element => { if (element) inputs.current.set(keyOf(slot), element); else inputs.current.delete(keyOf(slot)); }} />;
  // 페이지 번호·전체 페이지는 마지막으로 고르던 칸의 끝에 넣는다.
  const insertToken = (token: string) => {
    const slot = last.current, current = read(slot);
    write(slot, `${current}${current && !current.endsWith(' ') ? ' ' : ''}${token}`);
    requestAnimationFrame(() => inputs.current.get(keyOf(slot))?.focus());
  };
  const papers = (Object.keys(PAPERS) as Paper[]).map(paper => ({ value: paper, label: `${paper} (${PAPERS[paper].width} × ${PAPERS[paper].height}mm)` }));
  return <aside aria-label="문서 설정" className="box-border flex min-h-0 min-w-0 flex-1 flex-col self-stretch border-l bg-background">
    <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
      <SegmentedControl label="설정 묶음" value={tab} onChange={onTab} options={[{ value: 'document', label: '문서' }, { value: 'headerFooter', label: '머리말 · 바닥글' }]} />
      <Button variant="ghost" size="icon-sm" aria-label="문서 설정 닫기" title="닫기" className="text-icon-muted" onClick={onClose}><XIcon /></Button>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto pb-6 [scrollbar-width:thin]">
      {tab === 'document' ? <>
        <DocumentSettingsSection title="용지">
          <Select items={papers} value={setup.paper} onValueChange={value => { if (value) set({ paper: value as Paper }); }}>
            <SelectTrigger size="sm" aria-label="용지 크기" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{papers.map(paper => <SelectItem key={paper.value} value={paper.value}>{paper.label}</SelectItem>)}</SelectContent>
          </Select>
          <SegmentedControl label="방향" value={setup.orientation} onChange={orientation => set({ orientation })} className="w-full"
            options={[{ value: 'portrait', label: '세로' }, { value: 'landscape', label: '가로' }]} />
        </DocumentSettingsSection>
        <DocumentSettingsSection title="여백">
          <div className="flex gap-2">{margin('top')}{margin('bottom')}</div>
          <div className="flex gap-2">{margin('left')}{margin('right')}</div>
        </DocumentSettingsSection>
      </> : <>
        <DocumentSettingsSection title="배치">
          <Field orientation="horizontal" className="items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <FieldLabel htmlFor={switchId}>첫 페이지 다르게</FieldLabel>
              <FieldDescription className="text-xs">표지처럼 첫 페이지에는 머리말·바닥글을 두지 않습니다.</FieldDescription>
            </div>
            <Switch appearance="compact" id={switchId} checked={setup.differentFirstPage} onCheckedChange={value => set({ differentFirstPage: value })} />
          </Field>
        </DocumentSettingsSection>
        <DocumentSettingsSection title="머리말">
          <div className="flex gap-2">{text({ area: 'header', side: 'left' }, '왼쪽')}{text({ area: 'header', side: 'right' }, '오른쪽')}</div>
          <DocumentNumberField label="위 가장자리에서" unit="mm" min={0} max={40} placeholder={DEFAULT_PAGE_SETUP.headerDistance} value={setup.headerDistance}
            onChange={value => set({ headerDistance: value })} />
        </DocumentSettingsSection>
        <DocumentSettingsSection title="바닥글">
          <div className="flex gap-2">{text({ area: 'footer', side: 'left' }, '왼쪽')}{text({ area: 'footer', side: 'center' }, '가운데')}{text({ area: 'footer', side: 'right' }, '오른쪽')}</div>
          <DocumentNumberField label="아래 가장자리에서" unit="mm" min={0} max={40} placeholder={DEFAULT_PAGE_SETUP.footerDistance} value={setup.footerDistance}
            onChange={value => set({ footerDistance: value })} />
        </DocumentSettingsSection>
        <DocumentSettingsSection title="페이지 번호">
          <p className="text-xs text-muted-foreground">마지막으로 고르던 칸의 끝에 넣습니다.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="px-4" onMouseDown={event => event.preventDefault()} onClick={() => insertToken('{page}')}>페이지 번호 넣기</Button>
            <Button variant="secondary" className="px-4" onMouseDown={event => event.preventDefault()} onClick={() => insertToken('{total}')}>전체 페이지 넣기</Button>
          </div>
        </DocumentSettingsSection>
      </>}
    </div>
  </aside>;
}
