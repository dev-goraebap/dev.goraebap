import type { Issue, IssuePriority, IssueStatus } from '../entities/issue';

type Entry = [number, string, string, IssueStatus, IssuePriority, string | undefined, string | undefined, number | undefined];

const entries: Entry[] = [
  [12, '주문 목록이 느려지는 문제 찾기', '주문이 천 건을 넘으면 목록을 여는 데 3초 넘게 걸립니다. 어느 조회가 느린지 확인하고 줄일 방법을 정합니다.', 'doing', 'high', '서윤', '2026-11-12', undefined],
  [13, '느린 조회 구간 측정하기', '화면 단위가 아니라 조회 단위로 걸린 시간을 남깁니다.', 'done', 'medium', '지우', '2026-11-06', 12],
  [14, '목록 조회에 인덱스 추가하기', '측정 결과에서 가장 오래 걸린 두 조회부터 줄입니다.', 'doing', 'high', '서윤', '2026-11-11', 12],
  [15, '개선 뒤 응답 시간 다시 재기', '같은 데이터로 전과 후를 비교해 기록합니다.', 'todo', 'medium', undefined, undefined, 12],
  [8, '로그인 화면 문구 정리', '오류 문구가 상황마다 다르게 나옵니다. 한 가지 어조로 맞춥니다.', 'review', 'low', '하은', '2026-11-09', undefined],
  [9, '결제 실패 시 안내가 사라지는 문제', '결제가 실패한 뒤 새로고침하면 안내가 보이지 않습니다. 실패한 주문 번호는 남겨 두어야 합니다.', 'todo', 'urgent', '도현', '2026-11-07', undefined],
  [10, '알림 설정 화면 만들기', '이메일과 앱 알림을 종류별로 끄고 켭니다.', 'todo', 'medium', '민준', '2026-11-20', undefined],
  [11, '아주 긴 제목이 목록과 보드 카드에서 가로로 넘치지 않고 정해진 줄 수에서 말줄임되는지 확인하는 이슈', '긴 제목은 행에서는 한 줄, 카드에서는 두 줄까지 보이고 상세에서는 줄을 바꿔 전부 보입니다.', 'todo', 'low', '지우', undefined, undefined],
  [6, '검색 결과 정렬 기준 바꾸기', '관련도 순과 최신 순을 고를 수 있게 합니다.', 'review', 'medium', '서윤', '2026-11-14', undefined],
  [5, '프로필 사진 올리기 오류 수정', '2MB를 넘는 사진을 올리면 아무 안내 없이 멈춥니다.', 'doing', 'high', '민준', '2026-11-10', undefined],
  [4, '월간 리포트 내려받기', '지난달 활동을 표로 내려받습니다.', 'done', 'medium', '하은', '2026-11-03', undefined],
  [3, '도움말 문서 목차 개편', '자주 찾는 순서로 목차를 다시 묶습니다.', 'done', 'low', '지우', undefined, undefined],
  [2, '초대 메일 재발송 버튼', '받지 못한 사람에게 다시 보냅니다.', 'review', 'medium', '도현', '2026-11-13', undefined],
  [1, '다크 모드에서 표 선이 보이지 않는 문제', '표의 구분선이 배경과 같은 색으로 보입니다.', 'todo', 'medium', '하은', '2026-11-18', undefined],
];

const at = (day: number, hour = 9) => `2026-11-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`;

export const seedIssues: Issue[] = entries.map(([number, title, summary, status, priority, assignee, due, parent], index) => ({
  id: `ISS-${number}`,
  title,
  status,
  priority,
  assignee,
  due,
  parent: parent === undefined ? undefined : `ISS-${parent}`,
  author: ['서윤', '지우', '도현'][index % 3],
  createdAt: at(1 + (index % 5)),
  updatedAt: at(8 - Math.floor(index / 3), 9 + (index % 8)),
  body: {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: summary }] },
      { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '끝났다고 볼 기준' }] },
      { type: 'paragraph', content: [{ type: 'text', text: '다른 사람이 같은 조작을 해도 같은 결과가 나오고, 확인한 방법이 이슈에 남아 있으면 끝난 것으로 봅니다.' }] },
    ],
  },
  comments: number === 12
    ? [
      { id: 'c1', author: '지우', text: '측정은 끝났습니다. 가장 느린 조회는 주문 상태별 집계였습니다.', at: at(6, 15) },
      { id: 'c2', author: '도현', text: '인덱스를 추가하면 쓰기가 느려질 수 있으니 같이 확인해 주세요.', at: at(7, 10) },
    ]
    : [],
}));
