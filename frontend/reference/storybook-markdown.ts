const entries: Record<string, string> = {
  'theme.md': 'foundations-theme', 'icons.md': 'foundations-icons', 'foundations.md': 'foundations-geometry',
  'basic-components.md': '기본-부품-사용-기준', 'composed-components.md': '조합-부품-사용-기준',
  'creation-form.md': 'creation', 'dialog.md': 'dialog', 'app-layout.md': 'layout', 'route-masking.md': 'routing',
  'CreationForm.tsx': 'creation', 'RichTextBody.tsx': 'creation', 'CreationForm.stories.tsx': 'creation',
  'ReferenceDialog.tsx': 'dialog', 'Dialog.stories.tsx': 'dialog',
  'WorkspaceShell.tsx': 'layout', 'Page.tsx': 'layout', 'AppLayout.stories.tsx': 'layout',
  'RoutedPanel.ts': 'routing', 'RouteMasking.stories.tsx': 'routing',
};

/** Keep checkout-relative links in skill Markdown; resolve catalog links in the viewer. */
export function storybookMarkdown(markdown: string) {
  return markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (link, label: string, href: string) => {
    if (href.startsWith('#')) return link;
    if (/^https?:/.test(href) && !href.startsWith('https://github.com/dev-goraebap/goraebap-workflow/blob/main/frontend/')) return link;
    const file = href.split('/').at(-1)!;
    const entry = entries[file];
    return entry ? `[${label}](?path=/docs/${entry.startsWith('foundations-') || entry.startsWith('기본-') || entry.startsWith('조합-') ? entry : `patterns-${entry}`}--사용-기준${/\.tsx?$/.test(file) && !file.includes('.stories.') ? '#implementation' : ''})` : label;
  });
}
