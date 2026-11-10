import { DEFAULT_PAGE_SETUP, type PageSetup } from '@/shared/ui/composites/document/model';
import type { JSONContent } from '@tiptap/react';

const text = (value: string): JSONContent => ({ type: 'text', text: value });
const p = (value: string): JSONContent => ({ type: 'paragraph', content: [text(value)] });
const h = (level: 2 | 3, value: string): JSONContent => ({ type: 'heading', attrs: { level }, content: [text(value)] });
const list = (type: 'bulletList' | 'orderedList', items: string[]): JSONContent => ({ type, content: items.map(item => ({ type: 'listItem', content: [p(item)] })) });
const cell = (type: 'tableHeader' | 'tableCell', value: string): JSONContent => ({ type, content: [p(value)] });
const table = (head: string[], rows: string[][]): JSONContent => ({
  type: 'table', content: [{ type: 'tableRow', content: head.map(value => cell('tableHeader', value)) },
    ...rows.map(row => ({ type: 'tableRow', content: row.map(value => cell('tableCell', value)) }))],
});

const LONG = '이 절은 페이지 나누기를 시험하려고 넣은 본문입니다. 짧은 문단이 페이지 끝에 걸리면 통째로 다음 페이지 첫머리로 옮겨 가고, 긴 문단은 넘치는 줄부터 다음 페이지로 이어집니다. '
  + '글꼴과 줄 간격은 읽는 화면과 인쇄가 같아서, 화면에서 보는 페이지 경계가 PDF에서도 같은 자리에 생깁니다.';
// 한 페이지보다 긴 문단: 어디에 놓이든 줄 단위로 두 페이지 이상에 걸친다.
const VERY_LONG = Array.from({ length: 18 }, () => LONG).join(' ');

/** 여러 페이지에 걸치는 견본 정의서: 제목·문단·아주 긴 문단·긴 목록·긴 표·코드·도표·인용이 섞여 페이지 경계를 여러 모양으로 만든다. */
export function sampleDocument(): { title: string; body: JSONContent; setup: PageSetup } {
  const sections: JSONContent[] = [];
  const chapters = ['소개와 목표', '제약과 관례', '맥락과 범위', '해결 전략', '구성 요소', '실행 흐름', '배치와 운영', '품질 요구'];
  chapters.forEach((name, index) => {
    sections.push(h(2, `${index + 1}. ${name}`));
    sections.push(p(`${name}에서 다룰 내용을 정리합니다. ${LONG}`));
    sections.push(h(3, `${index + 1}.1 핵심 결정`));
    sections.push(p(LONG));
    if (index % 2 === 0) sections.push(list('bulletList', Array.from({ length: 9 }, (_, item) => `${name} 확인 항목 ${item + 1}: 담당과 기한을 정하고 결과를 기록합니다.`)));
    else sections.push(list('orderedList', Array.from({ length: 6 }, (_, item) => `${item + 1}단계 — 요청을 받고 검사한 뒤 결과를 돌려줍니다.`)));
    if (index === 2 || index === 5) sections.push(table(['구분', '책임', '비고'], Array.from({ length: index === 5 ? 34 : 8 }, (_, row) => [`항목 ${row + 1}`, row % 2 ? '서버' : '화면', '변경 시 함께 검토'])));
    if (index === 1) sections.push(p(VERY_LONG));
    if (index === 3) sections.push({ type: 'codeBlock', attrs: { language: 'ts' }, content: [text('export function paginate(blocks: Block[], page: Page) {\n  let top = 0;\n  for (const block of blocks) {\n    if (top + block.height > page.content) top = 0;\n    top += block.height;\n  }\n}')] });
    if (index === 4) sections.push({ type: 'mermaidBlock', attrs: { source: 'flowchart LR\n  A[작성] --> B[쪽 배치]\n  B --> C[읽기]\n  B --> D[인쇄·PDF]' } });
    if (index === 6) sections.push({ type: 'blockquote', content: [p('운영 서버의 설정은 배포와 따로 바꾸지 않습니다. 바꿀 때는 되돌리는 방법을 먼저 적습니다.')] });
    sections.push(h(3, `${index + 1}.2 남은 일`));
    sections.push(p(LONG));
    sections.push(p(LONG));
  });
  const setup: PageSetup = { ...DEFAULT_PAGE_SETUP, header: { left: '시스템 정의서', right: '설계 문서 · 1.0' },
    footer: { left: 'Webcraft', center: '대외비', right: '{page} / {total}' } };
  return { title: '시스템 정의서', body: { type: 'doc', content: sections }, setup };
}
