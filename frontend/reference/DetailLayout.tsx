import { Text } from '@astryxdesign/core/Text';
import type { ReactNode } from 'react';

export type DetailSection = { title: string; items: ReactNode };

export function DetailLayout({ label, head, title, sections, children }: {
  label: string; head?: ReactNode; title: ReactNode; sections: DetailSection[]; children: ReactNode;
}) {
  return <section className="reference-detail" aria-label={label}>
    <article className="reference-detail-grid">
      {head ? <header className="reference-detail-head">{head}</header> : null}
      <header className="reference-detail-title">{title}</header>
      {sections.length ? <aside className="reference-detail-side" aria-label="속성">
        {sections.map(section => <section key={section.title} className="reference-detail-section" aria-label={section.title}>
          <Text className="reference-detail-section-title" type="supporting" weight="medium" color="secondary">{section.title}</Text>
          {section.items}
        </section>)}
      </aside> : null}
      <section className="reference-detail-body" aria-label="본문">{children}</section>
    </article>
  </section>;
}
