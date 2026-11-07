import { Theme } from '@astryxdesign/core/theme';
import type { ReactNode } from 'react';
import { workspaceTheme } from './theme';
import './variants';
import './reference.css';
import './responsive.css';

export function ReferenceTheme({ mode = 'system', children }: { mode?: 'system' | 'light' | 'dark'; children: ReactNode }) {
  return <Theme theme={workspaceTheme} mode={mode}>{children}</Theme>;
}
