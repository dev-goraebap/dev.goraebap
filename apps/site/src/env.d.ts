/// <reference types="vite/client" />

declare module 'virtual:guide-docs' {
  export const docs: import('../content-plugin').GuideDoc[];
  export const skillGroups: readonly { skill: string; label: string; icon: string }[];
  export const contentGroups: readonly { dir: string; label: string; icon: string }[];
  export const architectureSections: readonly { id: string; label: string; icon?: string }[];
}

declare module '*.md' {
  import type { ComponentType } from 'react';
  const Content: ComponentType<{ components?: Record<string, unknown> }>;
  export default Content;
}

declare module '*.mdx' {
  import type { ComponentType } from 'react';
  const Content: ComponentType<{ components?: Record<string, unknown> }>;
  export default Content;
}
