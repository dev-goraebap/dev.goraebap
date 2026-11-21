import type { ReactNode } from 'react';

export function DocumentSettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return <section aria-label={title} className="flex flex-col gap-3 border-t p-4">
    <h3 className="text-sm font-semibold">{title}</h3>
    {children}
  </section>;
}
