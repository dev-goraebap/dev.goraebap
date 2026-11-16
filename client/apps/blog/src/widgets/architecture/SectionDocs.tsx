import { architectureSections, docsOfSection } from '@/entities/document';
import { Link } from '@tanstack/react-router';

/** 절 개요 페이지 주소(content-plugin의 sectionPath와 같다). */
const sectionPath = (id: string): string => `/webcraft/architecture/${id.replace('.', '-')}/`;
const where = (source: string) => source.startsWith('plugins/') ? '지침' : '해설';

function DocList({ id }: { id: string }) {
  const found = docsOfSection(id).filter(doc => !doc.path.startsWith('/webcraft/architecture/'))
    .sort((a, b) => Number(b.source.startsWith('plugins/')) - Number(a.source.startsWith('plugins/')));
  if (!found.length) return <p>이 절을 원천으로 삼는 지침 문서가 없습니다. 위 개요가 이 절의 내용 전부입니다.</p>;
  return <ul>
    {found.map(doc => <li key={doc.path}>
      <Link to={doc.path}>{doc.title}</Link> ({where(doc.source)}{doc.arc42?.[0] === id ? '' : `, 주로 ${doc.arc42?.[0]}절`})
      {doc.description ? ` — ${doc.description}` : null}
    </li>)}
  </ul>;
}

/**
 * 아키텍처 절 개요 페이지의 문서 목록: 프론트매터 arc42에 그 절을 가진 지침과 화면 해설. 하위 절이 있으면(8절) 하위 절마다
 * 제목과 목록을 둔다. 목록은 빌드 때의 문서 목록에서 만들므로 문서에 arc42를 붙이면 따로 고치지 않아도 나타난다.
 */
export function SectionDocs({ section }: { section: string }) {
  const subsections = architectureSections.filter(item => item.id.startsWith(`${section}.`));
  if (!subsections.length) return <DocList id={section} />;
  return <>
    {subsections.map(item => <section key={item.id} aria-labelledby={`section-${item.id}`}>
      <h3 id={`section-${item.id}`}><Link to={sectionPath(item.id)}>{item.id} {item.label}</Link></h3>
      <DocList id={item.id} />
    </section>)}
  </>;
}
