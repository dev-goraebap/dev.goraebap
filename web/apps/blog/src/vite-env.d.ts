/// <reference types="vite/client" />

declare module "*.mdx" {
  import type { ComponentType } from "react";
  export const frontmatter: Record<string, unknown> | undefined;
  const Content: ComponentType<{ components?: Record<string, unknown> }>;
  export default Content;
}

declare module "*.md" {
  import type { ComponentType } from "react";
  export const frontmatter: Record<string, unknown> | undefined;
  const Content: ComponentType<{ components?: Record<string, unknown> }>;
  export default Content;
}
