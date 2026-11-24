import type { ReactNode } from "react";
import type { AppShellVariant } from "../ui/LayoutPreviews";

export type LayoutLevel = "shell" | "content";

export interface LayoutExample {
  id: string;
  title: string;
  description: string;
  defaultWidth?: number;
  relatedLayoutId?: string;
  getCode: (variant: AppShellVariant) => string;
  renderPreview: (variant: AppShellVariant) => ReactNode;
}

export interface LayoutDocSpec {
  id: string;
  name: string;
  level: LayoutLevel;
  summary: string;
  variants?: { id: AppShellVariant; label: string }[];
  getCode: (variant: AppShellVariant) => string;
  renderPreview: (variant: AppShellVariant) => ReactNode;
  renderThumbnail: () => ReactNode;
  examples?: LayoutExample[];
}
