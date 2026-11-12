import { InternationalizationProvider } from '@astryxdesign/core/i18n';
import ko from '@astryxdesign/core/locales/ko-KR.json';
import { Theme } from '@astryxdesign/core/theme';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import koExtra from './i18n/ko-KR-extra.json';
import { workspaceTheme } from './theme';
import { themeColors } from './colors';
import './variants';

/**
 * Astryx 부품의 기본 문구(건너뛰기 링크, "필수", 날짜 입력, 단계 표시 등)를 한국어로 둔다. Astryx가 주는 ko-KR 묶음에
 * 빠진 문구는 ko-KR-extra.json이 채운다. Astryx를 올린 뒤 빠진 문구가 늘면 같은 파일에 더한다.
 */
const messages = { 'ko-KR': ko };
const overrides = { 'ko-KR': koExtra as Record<string, string> };

export const ThemePreferenceContext=createContext<(mode:'light'|'dark'|'system')=>void>(()=>{});
export const useThemePreference=()=>useContext(ThemePreferenceContext);

/** 앱 루트에서 한 번 감싼다. 전역 CSS(base.css)는 앱 진입점에서 먼저 읽는다. */
export function ReferenceTheme({ mode = 'system', children }: { mode?: 'system' | 'light' | 'dark'; children: ReactNode }) {
  const [preference,setPreference]=useState<'light'|'dark'|'system'>();
  useEffect(()=>setPreference(undefined),[mode]);
  const activeMode = preference ?? mode;
  useEffect(() => {
    const system = matchMedia('(prefers-color-scheme: dark)');
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.append(meta); }
    const update = () => {
      const dark = activeMode === 'dark' || (activeMode === 'system' && system.matches);
      const color = themeColors.surface[dark ? 1 : 0];
      meta.content = color;
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      document.documentElement.style.backgroundColor = color;
    };
    update();
    system.addEventListener('change', update);
    return () => system.removeEventListener('change', update);
  }, [activeMode]);
  return <ThemePreferenceContext value={setPreference}><InternationalizationProvider locale="ko-KR" messages={messages} overrides={overrides}>
    <Theme theme={workspaceTheme} mode={preference??mode}>{children}</Theme>
  </InternationalizationProvider></ThemePreferenceContext>;
}
