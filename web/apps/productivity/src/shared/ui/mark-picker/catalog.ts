import { SOLAR_ICONS } from '../icons/solar-icons';

/**
 * The app's own icons a mark picks from first (solarIcon's meaning names), before the Solar ones by `s:` and their name:
 * BIT's mark icons, each as the cowork icon of the same meaning, then the six projects took before (client/'s MARK_ICONS).
 */
export const MARK_ICONS: readonly string[] = [
  'layout-list', 'rows', 'layout-board', 'calendar', 'milestone', 'decision', 'book', 'people', 'user', 'priority', 'tag', 'agent',
  'wiki', 'branch', 'workflow', 'tasks', 'shield', 'home', 'projects', 'release', 'code', 'component', 'idea', 'team',
];
/** The icon a new mark starts with (BIT's board). */
export const DEFAULT_MARK_ICON = 'layout-board';

/**
 * The icons a mark picker offers first, before the whole set (BIT's): the app's own mark icons, then the Solar ones teams
 * reach for most, drawn at once as `s:` and their name (scripts/generate-icons.mjs's MARKS).
 */
export const COMMON = [...MARK_ICONS, ...Object.keys(SOLAR_ICONS).filter(name => name.startsWith('s:'))];

// Every Solar icon in its Linear style (virtual:solar-set, vite.config.ts), fetched once on first need as its own chunk;
// the app's first load carries only the icons it names.
let solar: Record<string, string> | undefined;
let loadingSolar: Promise<Record<string, string>> | undefined;
export const loadedSolar = () => solar;
export function loadSolar() {
  loadingSolar ??= import('virtual:solar-set').then(module => (solar = module.default));
  return loadingSolar;
}

/** Words of a Solar icon's name, for search: `alarm-add` is alarm add, `bag-2` bag 2. */
const iconWords = (name: string) => name.replace(/-/g, ' ');

/**
 * Korean words for the icons people look for most, so 달력 finds the calendars. Each points at English words of icon
 * names; the rest of the set is found by its English name.
 */
const KOREAN: Readonly<Record<string, string>> = {
  달력: 'calendar', 일정: 'calendar', 시계: 'clock', 시간: 'clock timer', 사람: 'user', 사용자: 'user', 팀: 'users group', 구성원: 'users group', 회의: 'users chat',
  폴더: 'folder', 파일: 'file', 문서: 'file text', 책: 'book', 집: 'home house', 홈: 'home house', 설정: 'settings cog', 별: 'star', 즐겨찾기: 'star bookmark',
  북마크: 'bookmark', 하트: 'heart', 좋아요: 'heart thumbs', 깃발: 'flag', 태그: 'tag', 라벨: 'tag', 링크: 'link', 목록: 'list', 할일: 'list todo check',
  체크: 'check', 보드: 'kanban', 칸반: 'kanban', 표: 'table', 차트: 'chart graph', 그래프: 'graph chart', 통계: 'chart', 데이터: 'database', 서버: 'server',
  클라우드: 'cloud', 구름: 'cloud', 해: 'sun', 달: 'moon', 번개: 'bolt lightning', 불: 'fire flame', 물: 'water waterdrop', 나무: 'tree', 꽃: 'flower', 잎: 'leaf',
  고양이: 'cat', 개: 'dog', 강아지: 'dog', 새: 'bird', 물고기: 'fish', 코드: 'code', 터미널: 'terminal', 버그: 'bug', 로켓: 'rocket', 메일: 'letter mailbox',
  편지: 'letter', 전화: 'phone', 카메라: 'camera', 사진: 'image camera', 영상: 'video videocamera', 음악: 'music note', 지도: 'map', 위치: 'map point', 지구: 'global globe earth',
  언어: 'languages', 잠금: 'lock', 보안: 'shield lock', 방패: 'shield', 열쇠: 'key', 알림: 'bell', 검색: 'magnifier', 대화: 'chat dialog', 댓글: 'chat',
  연필: 'pencil', 펜: 'pen', 디자인: 'palette pen', 붓: 'brush', 도구: 'wrench', 망치: 'hammer', 학교: 'academic cap', 병원: 'hospital',
  건물: 'buildings', 회사: 'buildings case', 가방: 'case bag', 자동차: 'car', 비행기: 'plane', 배: 'ship sailboat', 자전거: 'bike', 선물: 'gift',
  커피: 'cup hot', 컵: 'cup', 음식: 'utensils pizza', 피자: 'pizza', 장바구니: 'shopping cart', 쇼핑: 'shopping', 상자: 'box package', 택배: 'package truck',
  돈: 'dollar banknote wallet money', 지갑: 'wallet', 결제: 'card', 카드: 'card', 전구: 'lightbulb', 아이디어: 'lightbulb', 목표: 'target',
  트로피: 'cup star', 상: 'medal cup', 시작: 'play', 재생: 'play', 정지: 'pause square', 휴지통: 'trash', 삭제: 'trash', 다운로드: 'download',
  업로드: 'upload', 공유: 'share', 경고: 'danger', 정보: 'info', 질문: 'question help', 도움: 'help', 결정: 'scale', 저울: 'scale',
  브랜치: 'git branch', 깃: 'git', 흐름: 'workflow', 게임: 'gamepad', 헤드폰: 'headphones', 노트북: 'laptop', 컴퓨터: 'monitor computer',
  휴대폰: 'smartphone', 모바일: 'smartphone', 배터리: 'battery', 와이파이: 'wifi', 집중: 'target focus', 마법: 'magic wand', 반짝: 'stars',
  에이전트: 'bot stars', 로봇: 'bot', 인공지능: 'bot brain stars', 뇌: 'brain', 건강: 'heart pulse activity', 운동: 'dumbbell activity',
};

/** The icon names a query finds: English words of the name, or a Korean word's English words. */
export function searchIcons(names: readonly string[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return names;
  const korean = Object.entries(KOREAN).filter(([word]) => word.includes(q) || q.includes(word)).flatMap(([, english]) => english.split(' '));
  // The closest first: the whole name, a name that starts with the query, a word of it, then a Korean word's icons.
  const rank = (name: string) => {
    const words = iconWords(name);
    if (words.replace(/ /g, '') === q.replace(/ /g, '')) return 0;
    if (words.startsWith(q)) return 1;
    if (words.split(' ').includes(q)) return 2;
    if (words.includes(q)) return 3;
    return korean.some(word => words.split(' ').includes(word)) ? 4 : 9;
  };
  return names.map(name => ({ name, score: rank(name) })).filter(hit => hit.score < 9).sort((a, b) => a.score - b.score).map(hit => hit.name);
}
