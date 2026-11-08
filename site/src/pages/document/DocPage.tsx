import { Outline } from '@astryxdesign/core/Outline';
import { Text } from '@astryxdesign/core/Text';
import { useIsPhone } from '@/shared/ui/foundations/media';
import { RouterLink } from '@/shared/ui/patterns/routing/RouterLink';
import { useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import type { GuideDoc } from '../../entities/document';
import styles from '../../shared/styles/prose.module.css';

type Heading = { id: string; label: string; level: number };

/** 문서 한 장: 읽는 폭(약 720px) 열의 본문과, 넓은 화면에서만 오른쪽의 문서 안 목차. 목차는 그려진 제목에서 만든다. */
export function DocPage({ doc, Content }: { doc: GuideDoc | null; Content: ComponentType | null }) {
  const isPhone = useIsPhone();
  const article = useRef<HTMLElement>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
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
  return <div className={styles.body} data-arrive>
    <article ref={article} className={styles.prose}>
      {doc ? <>{doc.hasTitle ? null : <h1>{doc.title}</h1>}{doc.kind === 'post' ? <div className={styles.postMeta}><time dateTime={doc.date}>{doc.date}</time>{doc.updated && doc.updated !== doc.date ? <span>수정 {doc.updated}</span> : null}{doc.tags?.map(tag => <RouterLink key={tag} href={`/blog/?tag=${encodeURIComponent(tag)}`}>{tag}</RouterLink>)}</div> : null}{Content ? <Content /> : null}</> : <>
        <h1>없는 문서</h1>
        <p>주소에 해당하는 문서가 없습니다. 문서가 옮겨졌거나 이름이 바뀌었을 수 있습니다.</p>
        <ul>
          <li><RouterLink href="/">처음으로</RouterLink></li>
          <li>왼쪽 메뉴에서 고르거나, 머리 줄의 문서 찾기(Ctrl K)로 제목을 찾습니다.</li>
        </ul>
      </>}
    </article>
    {!isPhone ? <aside className={styles.outline}>
      {headings.length > 1 ? <Text type="supporting" color="secondary" weight="semibold">이 문서</Text> : null}
      {headings.length > 1 ? <Outline items={headings} label="이 문서의 목차" density="compact" /> : null}
    </aside> : null}
  </div>;
}
