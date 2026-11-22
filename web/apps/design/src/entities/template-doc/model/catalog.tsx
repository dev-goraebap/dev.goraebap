import type { ReactNode } from "react";
import { AppShellThumbnail, DialogThumbnail } from "../ui/TemplatePreviews";

export interface TemplateDocSpec {
  id: string;
  name: string;
  mobileTitle: string;
  renderThumbnail: () => ReactNode;
}

export const TEMPLATE_DOCS: TemplateDocSpec[] = [
  {
    id: "app-shell",
    name: "Inset AppShell",
    mobileTitle: "Inset AppShell",
    renderThumbnail: () => <AppShellThumbnail />,
  },
  {
    id: "responsive-dialog",
    name: "Responsive Dialog",
    mobileTitle: "Responsive Bottom Sheet",
    renderThumbnail: () => <DialogThumbnail />,
  },
];

export function getTemplateDoc(id: string) {
  return TEMPLATE_DOCS.find((item) => item.id === id);
}
