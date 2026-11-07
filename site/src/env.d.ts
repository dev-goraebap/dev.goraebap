/// <reference types="vite/client" />

declare module 'virtual:guide-docs' {
  import type { GuideDoc } from '../content-plugin';
  export const docs: GuideDoc[];
  export const skillGroups: readonly { skill: string; label: string; icon: string }[];
  export const contentGroups: readonly { dir: string; label: string; icon: string }[];
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
