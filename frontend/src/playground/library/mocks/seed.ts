import type { Resource } from '../entities/resource';

const entries = [
  ['design-tokens', '좋은 인터페이스를 만드는 작은 기준들', '간격과 글자, 색이 같은 언어로 이야기하도록 화면을 다듬으며 다시 읽을 기준을 모았습니다.', 'document', 'design'],
  ['seed-loading', '기다리는 시간을 설계하는 방법', '데이터를 기다리는 동안에도 현재 위치와 다음 행동을 놓치지 않도록.', 'link', 'design', 'https://example.com/patterns/loading-states-and-transitions-for-long-running-requests'],
  ['quiet-colors', '차분한 공간에서 찾은 색과 형태', '낮은 채도의 색과 자연광, 넉넉한 여백에 관한 시각 기록.', 'image', 'design'],
  ['router', '주소에 남겨야 하는 화면 상태', '검색 조건과 보고 있던 화면을 뒤로가기와 새로고침 뒤에도 이어갑니다.', 'link', 'development', 'https://tanstack.com/router/latest'],
  ['fsd', '페이지에서 시작하는 프론트엔드 구조', '실제로 공유하는 책임이 생겼을 때 코드를 추출하는 방법.', 'link', 'development', 'https://feature-sliced.design/'],
  ['reading-notes', '오래 쓰는 도구에 관한 메모', '눈에 띄는 기능보다 매일 반복하는 동작을 편안하게 만드는 일.', 'document', 'reading'],
  ['type-rhythm', '읽기 편한 화면의 글자 리듬', '제목과 본문, 보조 정보가 각자의 목소리로 보이도록 크기와 간격을 정리합니다.', 'document', 'design'],
  ['query', '서버 데이터와 화면 상태의 경계', '캐시·조회·변경과 사용자가 아직 저장하지 않은 초안을 구분합니다.', 'link', 'development', 'https://tanstack.com/query/latest'],
  ['long-title', '아주 긴 제목이 목록과 상세에서 가로로 넘치지 않고 정해진 폭에서 말줄임되거나 줄을 바꾸는지 확인하는 자료', '긴 이름·주소·한 단어로 이어진 문자열이 배치를 밀어내지 않아야 합니다.', 'document', 'reading'],
  ['keyboard', '키보드로 끝까지 쓸 수 있는 화면', '초점이 어디로 가고 어디로 돌아오는지가 화면의 품질을 보여 줍니다.', 'document', 'development'],
] as const;

export const seedResources: Resource[] = entries.map((entry, index) => ({
  id: entry[0],
  title: entry[1],
  summary: entry[2],
  kind: entry[3],
  collection: entry[4],
  url: entry[5],
  files: entry[3] === 'image' ? ['palette-study.webp'] : [],
  author: ['서윤', '지우', '도현'][index % 3],
  starred: index === 0 || index === 3,
  updatedAt: `2026-11-${String(7 - Math.floor(index / 2)).padStart(2, '0')}T09:00:00Z`,
  body: {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: entry[2] }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '다시 살펴볼 것' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '작은 차이가 쌓여 전체 경험을 만듭니다. 실제로 사용하는 상황에서 읽고, 조작하고, 다시 돌아왔을 때도 자연스러운지 확인합니다.' }] },
    ],
  },
}));
