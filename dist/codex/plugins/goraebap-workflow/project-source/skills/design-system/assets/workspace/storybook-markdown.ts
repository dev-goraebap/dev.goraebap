const entries: Record<string, string> = {
  'creation-form.md': 'creation', 'dialog.md': 'dialog', 'app-layout.md': 'layout', 'route-masking.md': 'routing',
  'CreationForm.tsx': 'creation', 'RichTextBody.tsx': 'creation', 'CreationForm.stories.tsx': 'creation',
  'ReferenceDialog.tsx': 'dialog', 'Dialog.stories.tsx': 'dialog',
  'WorkspaceShell.tsx': 'layout', 'Page.tsx': 'layout', 'AppLayout.stories.tsx': 'layout',
  'RoutedPanel.ts': 'routing', 'RouteMasking.stories.tsx': 'routing',
};

/** Keep checkout-relative links in skill Markdown; resolve catalog links in the viewer. */
export function storybookMarkdown(markdown: string) {
  return markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (link, label: string, href: string) => {
    if (/^(https?:|#)/.test(href)) return link;
    const file = href.split('/').at(-1)!;
    const entry = entries[file];
    return entry ? `[${label}](?path=/docs/patterns-${entry}--사용-기준${/\.tsx?$/.test(file) && !file.includes('.stories.') ? '#implementation' : ''})` : label;
  });
}
