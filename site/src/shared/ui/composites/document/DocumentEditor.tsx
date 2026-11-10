import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import type { JSONContent } from '@tiptap/react';
import { useRef, useState, type ReactNode } from 'react';
import { EditorToolbar } from '../editor/EditorToolbar';
import { RichEditor, type EditorHandle } from '../editor/RichEditor';
import type { LinkChoice, ReadLinkPreview, UploadFile } from '../editor/types';
import { icon } from '../../foundations/icons/solar-icon';
import { DocumentSettings, type SettingsTab } from './DocumentSettings';
import { useFitZoom, useIsPhoneScreen } from './hooks';
import { DEFAULT_PAGE_SETUP, formatOf, type DocumentMode, type PageLook, type PageSetup } from './model';
import type { PageArea } from './PageCanvas';
import type { PageLayout } from './pagination';
import { usePagedFrame } from './usePagedFrame';
import { ZoomControl, type ZoomSetting } from './ZoomControl';
import styles from './document.module.css';

/**
 * 문서 편집기. 위에 늘 붙은 서식 막대(왼쪽 확대/축소, 오른쪽 문서 설정과 toolbarEnd), 아래에 본문과 문서 설정 칸이다.
 * 페이지 모드는 종이(setup의 용지·방향·여백) 위에 쓰며 페이지 끝을 넘는 블록·줄·표 행이 다음 페이지로 넘어가고, 머리말·바닥글이 종이
 * 여백에 보인다(올리면 연필 단추, 누르면 설정 칸의 그 자리로). 페이지 없음은 읽는 폭 한 열에 이어 쓴다. 휴대폰은 늘 페이지 없음이다.
 * 페이지 설정을 바꾸면 에디터를 새로 만들지 않고 다시 나눈다. 모드를 바꾸면 에디터를 새로 만들되 쓴 내용은 그대로다(실행 취소 기록만 처음부터).
 * value는 처음 값이다. onSetupChange가 없으면 문서 설정 칸을 두지 않는다. look은 보는 사람의 화면 설정(PageLookMenu)이다.
 */
export function DocumentEditor({ value, onChange, mode = 'pages', setup = DEFAULT_PAGE_SETUP, onSetupChange, look, onLayout, above, toolbarEnd, label = '본문', placeholder,
  upload, readPreview, links }: {
  value: JSONContent; onChange: (value: JSONContent) => void; mode?: DocumentMode; setup?: PageSetup; onSetupChange?: (setup: PageSetup) => void;
  look?: PageLook; onLayout?: (layout: PageLayout) => void;
  /** 본문 위(제목 칸 등): 페이지 없음은 본문 열 폭, 페이지는 종이의 본문 여백에 맞춘다. */
  above?: ReactNode;
  /** 서식 막대 오른쪽 끝(페이지 모양·보기 전환 등). */
  toolbarEnd?: ReactNode;
  label?: string; placeholder?: string; upload?: UploadFile; readPreview?: ReadLinkPreview; links?: LinkChoice[];
}) {
  const isPhone = useIsPhoneScreen();
  const isPaged = !isPhone && mode === 'pages';
  const canSet = !!onSetupChange && isPaged;
  const [handle, setHandle] = useState<EditorHandle | null>(null);
  const [zoomSetting, setZoomSetting] = useState<ZoomSetting>('fit');
  const [settings, setSettings] = useState<{ tab: SettingsTab; focus: PageArea | null } | null>(null);
  // 모드를 바꿔 에디터를 새로 만들 때 지금까지 쓴 내용으로 시작한다.
  const latest = useRef(value);
  const format = formatOf(setup);
  const { ref, zoom: fit } = useFitZoom(format.width);
  const zoom = zoomSetting === 'fit' ? fit : zoomSetting / 100;
  const { extensions, frame } = usePagedFrame({ isPaged, setup, look, zoom, handle, onLayout,
    onEditArea: canSet ? area => setSettings({ tab: 'headerFooter', focus: area }) : undefined,
    activeArea: settings?.tab === 'headerFooter' ? settings.focus : null });
  const rem = (px: number) => `calc(${px / 16}rem * ${zoom})`;
  return <VStack className={styles.document}>
    <VStack className={styles.toolbarRow}>
      <EditorToolbar handle={handle} links={links}
        start={isPaged ? <ZoomControl value={zoomSetting} current={zoom} onChange={setZoomSetting} /> : undefined}
        end={<>
          {canSet ? <Button label="문서 설정" tooltip="문서 설정 (용지 · 여백 · 머리말 · 바닥글)" variant="ghost" size="sm" isIconOnly icon={icon('settings')}
            aria-pressed={!!settings} onClick={() => setSettings(now => now ? null : { tab: 'document', focus: null })} /> : null}
          {toolbarEnd}
        </>} />
    </VStack>
    <HStack className={styles.body}>
      <VStack ref={ref} className={isPaged ? styles.desk : styles.pageless} data-wide={isPaged && zoom > fit + 0.001 ? '' : undefined} gap={4}>
        {above ? <VStack className={isPaged ? styles.above : styles.column}
          style={isPaged ? { inlineSize: rem(format.width), paddingInline: `${rem(format.marginLeft)} ${rem(format.marginRight)}` } : undefined}>{above}</VStack> : null}
        <VStack className={isPaged ? undefined : styles.column}>
          <RichEditor key={isPaged ? 'pages' : 'pageless'} value={latest.current} onChange={next => { latest.current = next; onChange(next); }} isEditable isPage
            label={label} placeholder={placeholder} upload={upload} readPreview={readPreview} links={links} onReady={setHandle} extensions={extensions} frame={frame} />
        </VStack>
      </VStack>
      {canSet && settings ? <DocumentSettings setup={setup} onChange={onSetupChange!} tab={settings.tab} focus={settings.focus}
        onTab={tab => setSettings({ tab, focus: null })} onClose={() => setSettings(null)} /> : null}
    </HStack>
  </VStack>;
}
