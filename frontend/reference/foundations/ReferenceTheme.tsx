import { Theme } from '@astryxdesign/core/theme';
import type { ReactNode } from 'react';
import { workspaceTheme } from './theme';
import './variants';

/** 앱 루트에서 한 번 감싼다. 전역 CSS(base.css)는 앱 진입점에서 먼저 읽는다. */
export function ReferenceTheme({ mode = 'system', children }: { mode?: 'system' | 'light' | 'dark'; children: ReactNode }) {
  return <Theme theme={workspaceTheme} mode={mode}>{children}</Theme>;
}
