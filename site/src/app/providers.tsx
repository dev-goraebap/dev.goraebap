import { PreferencesProvider } from '@/entities/preferences';
import { MDXProvider } from '@mdx-js/react';
import type { ComponentPropsWithRef } from 'react';
import { GuideShell } from '@/widgets/site-shell';
import { Sample, SampleGroup, Source } from '@/widgets/samples';
import { SectionDocs } from '@/widgets/architecture';
import { Diagram } from '@/shared/markdown/Diagram';
import { ZoomImage } from '@/shared/markdown/ZoomImage';
import { RouterLink } from '@/shared/ui/patterns/routing/RouterLink';
import styles from '@/shared/styles/prose.module.css';
/** 문서 안의 링크: 가이드 주소는 라우터로 옮기고, 다른 사이트는 새 창으로 연다. */
function DocLink({ href = '', ...props }: ComponentPropsWithRef<'a'>) {
  const isExternal = /^https?:/.test(href);
  return <RouterLink href={href} {...(isExternal ? { target: '_blank', rel: 'noopener' } : {})} {...props} />;
}
/** 표는 테두리·가로 스크롤을 맡는 상자에 넣는다. 표 자체는 상자 폭을 다 채워 머리 행 바탕과 행 구분선이 끝까지 닿는다. */
function Table(props: ComponentPropsWithRef<'table'>) {
  return <div className={styles.table}><table {...props} /></div>;
}

const mdxComponents = { a: DocLink, table: Table, div: Diagram, img: ZoomImage, Sample, SampleGroup, Source, SectionDocs };

export function SiteApp() { return <PreferencesProvider><MDXProvider components={mdxComponents}><GuideShell /></MDXProvider></PreferencesProvider>; }
