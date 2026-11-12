import { MDXProvider } from '@mdx-js/react';
import type { ComponentPropsWithRef } from 'react';
import { PreferencesProvider } from '@/entities/preferences';
import { Diagram } from '@/shared/markdown/Diagram';
import { ZoomImage } from '@/shared/markdown/ZoomImage';
import { RouterAnchor } from '@/shared/ui/router-anchor';
import { Toaster } from '@/shared/ui/toast';
import { SectionDocs } from '@/widgets/architecture';
import { Sample, SampleGroup, Source } from '@/widgets/samples';
import { GuideShell } from '@/widgets/site-shell';

/** 문서 안의 링크: 가이드 주소는 라우터로 옮기고, 다른 사이트는 새 창으로 연다. */
function DocLink({ href = '', ...props }: ComponentPropsWithRef<'a'>) {
  const isExternal = /^https?:/.test(href);
  return <RouterAnchor href={href} {...(isExternal ? { target: '_blank', rel: 'noopener' } : {})} {...props} />;
}

/** 표는 테두리 · 가로 스크롤을 맡는 상자에 넣는다. 표 자체는 상자 폭을 다 채워 머리 행 바탕과 행 구분선이 끝까지 닿는다. */
function Table(props: ComponentPropsWithRef<'table'>) {
  return <div className="mb-4 max-w-full overflow-x-auto rounded-lg border"><table {...props} /></div>;
}

const mdxComponents = { a: DocLink, table: Table, div: Diagram, img: ZoomImage, Sample, SampleGroup, Source, SectionDocs };

/**
 * 사이트 루트(라우터의 루트 라우트 부품): 화면 설정, 알림(Toaster), MDX 본문 부품. 툴팁 제공자는 키트 AppShell이 둔다.
 * Astryx 시절의 ReferenceTheme · LinkProvider는 두지 않는다: 키트 부품은 TanStack Link를 직접 쓰고 다크는 html의 data-theme이 정한다.
 */
export function SiteApp() {
  return <PreferencesProvider>
    <Toaster>
      <MDXProvider components={mdxComponents}><GuideShell /></MDXProvider>
    </Toaster>
  </PreferencesProvider>;
}
