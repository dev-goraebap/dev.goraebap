import type { JSONContent } from '@tiptap/react';
import type { LinkChoice, LinkPreview, ReadLinkPreview, UploadFile } from '@/shared/ui/editor';

/*
 * 리치 에디터 견본의 가짜 호스트. 키트에는 서버가 없으므로 올리기는 고른 파일을 blob 주소로 돌려주고(진행률은 흉내),
 * 링크 미리보기는 정해 둔 답을 준다. 사진·HTML·파일은 견본을 열 때 만든 blob 주소다.
 */

const blob = (text: string, type: string) => URL.createObjectURL(new Blob([text], { type }));
/** 견본 사진: 색 띠와 원 몇 개로 그린 SVG. 색은 hsl로 고른다. */
const picture = (hue: number, width: number, height: number, label: string) => blob(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 55% 62%)"/><stop offset="1" stop-color="hsl(${hue + 40} 50% 38%)"/></linearGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/><circle cx="${width * 0.72}" cy="${height * 0.32}" r="${Math.min(width, height) * 0.16}" fill="hsl(${hue + 20} 70% 85% / 0.8)"/>
<path d="M0 ${height * 0.78} Q ${width * 0.3} ${height * 0.55} ${width * 0.55} ${height * 0.75} T ${width} ${height * 0.7} V ${height} H 0 Z" fill="hsl(${hue + 60} 35% 25% / 0.55)"/>
<text x="24" y="${height - 24}" font-family="sans-serif" font-size="${Math.round(height / 14)}" fill="hsl(0 0% 100% / 0.9)">${label}</text></svg>`, 'image/svg+xml');

export const pictures = {
  harbor: picture(200, 1200, 800, '항구의 오후'),
  forest: picture(110, 800, 800, '숲길'),
  dusk: picture(20, 800, 800, '해 질 녘'),
  card: picture(260, 1200, 630, '대표 이미지'),
};

const htmlPage = blob(`<!doctype html><html lang="ko"><meta charset="utf-8"><title>분기 지표</title>
<style>body{font:15px/1.6 system-ui,sans-serif;margin:24px}h1{font-size:20px}button{padding:6px 12px}</style>
<h1>분기 지표 미리보기</h1><p>올린 HTML 파일은 격리된 틀(sandbox) 안에서만 실행됩니다. 이 틀은 앱의 쿠키와 저장소에 닿지 못합니다.</p>
<p>누른 횟수: <b id="n">0</b></p><button onclick="document.getElementById('n').textContent=++window.c||(window.c=1)">눌러 보기</button></html>`, 'text/html');

export const files = [
  { name: '분기 보고서.pdf', mime: 'application/pdf', size: 482_000 },
  { name: '요구사항 정의.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 96_000 },
  { name: '매출 집계.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 210_000 },
  { name: '발표 자료.pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 2_400_000 },
  { name: '디자인 원본.zip', mime: 'application/zip', size: 8_100_000 },
  { name: '변경 기록.txt', mime: 'text/plain', size: 3_200 },
  { name: 'schema.ts', mime: 'text/plain', size: 5_800 },
].map(file => ({ ...file, url: blob(`${file.name} 견본 내용`, file.mime) }));

/** 가짜 올리기: 0.6초 동안 진행률을 올리고 blob 주소를 준다. 사진이면 가로·세로와 대표색을 재서 함께 준다. */
export const fakeUpload: UploadFile = async (file, progress, signal) => {
  for (const percent of [20, 45, 70, 100]) {
    await new Promise(resolve => setTimeout(resolve, 150));
    if (signal?.aborted) throw new DOMException('취소됨', 'AbortError');
    progress?.(percent);
  }
  const url = URL.createObjectURL(file);
  const traits = file.type.startsWith('image/') ? await measure(url) : {};
  return { url, name: file.name, mime: file.type || 'application/octet-stream', size: file.size, ...traits };
};
async function measure(url: string): Promise<{ width?: number; height?: number; dominantColor?: string }> {
  const image = new Image();
  image.src = url;
  try { await image.decode(); } catch { return {}; }
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 16;
  const context = canvas.getContext('2d');
  context?.drawImage(image, 0, 0, 16, 16);
  const data = context?.getImageData(0, 0, 16, 16).data;
  let r = 0, g = 0, b = 0;
  if (data) for (let index = 0; index < data.length; index += 4) { r += data[index]; g += data[index + 1]; b += data[index + 2]; }
  const hex = (sum: number) => Math.round(sum / 256).toString(16).padStart(2, '0');
  return { width: image.naturalWidth, height: image.naturalHeight, dominantColor: data ? `#${hex(r)}${hex(g)}${hex(b)}` : undefined };
}

const previews: Record<string, LinkPreview> = {
  'https://example.com/guides/reading': { url: 'https://example.com/guides/reading', site: '예제 가이드', title: '읽기 편한 화면을 만드는 열 가지 기준',
    description: '글자 크기와 줄 간격, 한 줄의 길이, 제목의 단계처럼 오래 읽는 화면에서 피로를 줄이는 기준을 모았습니다.', image: pictures.card },
  'https://example.org/notes': { url: 'https://example.org/notes', site: 'example.org', title: '작업 노트: 표와 목록 사이',
    description: '대표 사진을 밝히지 않은 페이지는 같은 자리에 빈 사진 칸을 둡니다.' },
};
/** 가짜 링크 미리보기: 0.4초 뒤 정해 둔 답을 준다. 모르는 주소는 실패해 주소만 있는 카드가 된다. */
export const fakePreview: ReadLinkPreview = async url => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const found = previews[url];
  if (!found) throw Error('미리보기를 읽지 못했습니다');
  return found;
};

/** 링크 입력 칸에서 이름으로 찾아 걸 문서들(앱 안의 주소). */
export const sampleLinks: LinkChoice[] = [
  { title: '화면 규칙 검토 메모', href: '/documents/screen-rules', hint: '디자인' },
  { title: '분기 회고', href: '/documents/retro', hint: '회의록' },
  { title: '배포 절차', href: '/documents/release', hint: '운영' },
  { title: '용어 사전', href: '/documents/glossary', hint: '참고' },
];

const text = (value: string, marks?: JSONContent['marks']): JSONContent => ({ type: 'text', text: value, ...(marks ? { marks } : {}) });
const p = (...content: JSONContent[]): JSONContent => ({ type: 'paragraph', content });
const h = (level: 2 | 3, value: string): JSONContent => ({ type: 'heading', attrs: { level }, content: [text(value)] });
const cell = (value: string, isHeader = false): JSONContent => ({ type: isHeader ? 'tableHeader' : 'tableCell', content: [p(text(value))] });
const image = (src: string, name: string, width: number, pixels: [number, number], color: string): JSONContent =>
  ({ type: 'media', attrs: { src, name, mime: 'image/svg+xml', width, size: 0, color, pixelWidth: pixels[0], pixelHeight: pixels[1] } });

/** 모든 블록이 들어 있는 견본 본문. */
export const richSample: JSONContent = { type: 'doc', content: [
  p(text('이 본문은 '), text('읽기와 편집이 같은 에디터', [{ type: 'bold' }]), text('입니다. 글을 고르면 서식 도구가, '), text('/', [{ type: 'code' }]),
    text('를 치면 블록 목록이 뜹니다. 글줄 왼쪽의 손잡이를 누르면 블록 메뉴가 열립니다. '),
    text('화면 규칙 검토 메모', [{ type: 'link', attrs: { href: '/documents/screen-rules' } }]), text('처럼 앱 안의 문서로 가는 링크는 이름표로 보입니다.')),
  h(2, '분기 지표'),
  p(text('색은 '), text('글자색', [{ type: 'textStyle', attrs: { color: 'var(--editor-ink-blue)' } }]), text('과 '),
    text('배경색', [{ type: 'highlight', attrs: { color: 'var(--editor-fill-yellow)' } }]), text('을 고를 수 있고, H'), text('2', [{ type: 'subscript' }]), text('O처럼 첨자도 씁니다.')),
  { type: 'table', content: [
    { type: 'tableRow', content: [cell('지표', true), cell('3분기', true), cell('4분기', true)] },
    { type: 'tableRow', content: [cell('활성 사용자'), cell('12,400'), cell('15,100')] },
    { type: 'tableRow', content: [cell('평균 응답 시간'), cell('420ms'), cell('310ms')] },
  ] },
  h(2, '흐름'),
  { type: 'mermaidBlock', attrs: { source: 'flowchart LR\n  A[요청] --> B{검토}\n  B -->|승인| C[배포]\n  B -->|보완| A' } },
  h(2, '사진과 파일'),
  image(pictures.harbor, '항구의 오후.svg', 100, [1200, 800], '#5f95b8'),
  image(pictures.forest, '숲길.svg', 50, [800, 800], '#6aa36a'),
  image(pictures.dusk, '해 질 녘.svg', 50, [800, 800], '#c46f3e'),
  ...files.slice(0, 3).map(file => ({ type: 'media', attrs: { src: file.url, name: file.name, mime: file.mime, size: file.size, width: 100 } })),
  { type: 'media', attrs: { src: htmlPage, name: '분기 지표.html', mime: 'text/html', size: 1_200, width: 100 } },
  h(2, '링크 카드'),
  { type: 'webEmbed', attrs: { source: 'https://example.com/guides/reading' } },
  { type: 'webEmbed', attrs: { source: 'https://example.org/notes' } },
  { type: 'taskList', content: [
    { type: 'taskItem', attrs: { checked: true }, content: [p(text('표 모양 맞추기'))] },
    { type: 'taskItem', attrs: { checked: false }, content: [p(text('도표 크게 보기 확인'))] },
  ] },
] };

/** 파일 카드의 종류별 색을 모두 보이는 본문. */
export const fileSample: JSONContent = { type: 'doc', content: files.map(file => ({ type: 'media', attrs: { src: file.url, name: file.name, mime: file.mime, size: file.size, width: 100 } })) };
