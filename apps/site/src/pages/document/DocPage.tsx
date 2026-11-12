import { Link } from '@tanstack/react-router';
import { useLayoutEffect, useRef, useState, type ComponentType, type MouseEvent } from 'react';
import type { GuideDoc } from '@/entities/document';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { paths } from '@/shared/config/paths';
import { cn } from '@/shared/lib/utils';
import { useTocSpy } from './use-toc-spy';

type Heading = { id: string; label: string; level: number };

/** 문서 한 장: 읽는 폭(약 720px) 열의 본문과, 넓은 화면에서만 오른쪽의 문서 안 목차. 목차는 그려진 제목에서 만든다. */
export function DocPage({ doc, Content }: { doc: GuideDoc | null; Content: ComponentType | null }) {
  const isMobile = useIsMobile();
  const article = useRef<HTMLElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, pin] = useTocSpy(headings.map(heading => heading.id), article);
  // 새 문서는 그리기 전에 맨 위(주소에 #이 있으면 그 제목)로 놓는다. 이전 스크롤 위치에서 잠깐 보이지 않게 한다.
  useLayoutEffect(() => {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    if (target) { target.scrollIntoView(); return; }
    let node = article.current?.parentElement ?? null;
    while (node && !/(auto|scroll)/.test(getComputedStyle(node).overflowY)) node = node.parentElement;
    if (node) node.scrollTop = 0;
  }, [doc?.path]);
  useLayoutEffect(() => {
    const node = article.current;
    if (!node) return undefined;
    const read = () => setHeadings([...node.querySelectorAll<HTMLElement>('h2[id], h3[id]')]
      .map(heading => ({ id: heading.id, label: heading.textContent ?? '', level: Number(heading.tagName[1]) })));
    read();
    // 견본 묶음처럼 제목이 나중에 그려지는 문서도 목차에 잡는다.
    const observer = new MutationObserver(read);
    observer.observe(node, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [doc?.path]);
  return <div className="flex justify-center gap-10 px-6 pt-8 pb-12 max-md:px-4 max-md:pt-5 max-md:pb-10">
    <article ref={article} className="prose min-w-0 flex-[0_1_45rem]">
      {doc ? <>
        {doc.hasTitle ? null : <h1>{doc.title}</h1>}
        {doc.kind === 'post' ? <div className="-mt-2 mb-8 flex flex-wrap gap-3 text-[0.8125rem] text-muted-foreground">
          <time dateTime={doc.date}>{doc.date}</time>
          {doc.updated && doc.updated !== doc.date ? <span>수정 {doc.updated}</span> : null}
          {doc.tags?.map(tag => <Link key={tag} to={paths.blog} search={{ tag } as never}>{tag}</Link>)}
        </div> : null}
        {Content ? <Content /> : null}
      </> : <>
        <h1>없는 문서</h1>
        <p>주소에 해당하는 문서가 없습니다. 문서가 옮겨졌거나 이름이 바뀌었을 수 있습니다.</p>
        <ul>
          <li><Link to="/">처음으로</Link></li>
          <li>왼쪽 메뉴에서 고르거나, 머리 줄의 문서 찾기(Ctrl K)로 제목을 찾습니다.</li>
        </ul>
      </>}
    </article>
    {/* 문서 안 목차: 넓은 화면(80rem 이상)에만, 본문을 따라 위에 붙어 있다. */}
    {!isMobile ? <aside className="sticky top-8 hidden max-h-[calc(100dvh-8rem)] flex-[0_0_13rem] flex-col gap-2 self-start overflow-auto min-[80rem]:flex">
      {headings.length > 1 ? <Outline headings={headings} activeId={activeId} onPick={pin} /> : null}
    </aside> : null}
  </div>;
}

/**
 * 목차 한 벌: 지금 읽는 제목은 진한 글자와 왼쪽 막대로 표시한다. 누르면 그 제목으로 스크롤하고, 사용자가 직접 스크롤할 때까지
 * 누른 제목을 지킨다(useTocSpy). 주소의 #도 바꿔 그 자리를 공유할 수 있다.
 */
function Outline({ headings, activeId, onPick }: { headings: Heading[]; activeId: string | undefined; onPick: (id: string) => void }) {
  const pick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    onPick(id);
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    history.replaceState(history.state, '', `#${encodeURIComponent(id)}`);
  };
  return <nav aria-label="이 문서의 목차" className="flex flex-col gap-2">
    <p className="text-xs font-semibold text-muted-foreground">이 문서</p>
    <ul className="flex flex-col border-l">
      {headings.map(heading => {
        const isActive = heading.id === activeId;
        return <li key={heading.id}>
          <a href={`#${heading.id}`} aria-current={isActive ? 'location' : undefined} onClick={event => pick(event, heading.id)}
            className={cn('-ml-px block border-l-2 border-transparent py-1 pr-1 text-[0.8125rem] leading-snug text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
              heading.level === 3 ? 'pl-6' : 'pl-3', isActive && 'border-foreground font-medium text-foreground')}>
            {heading.label}
          </a>
        </li>;
      })}
    </ul>
  </nav>;
}
