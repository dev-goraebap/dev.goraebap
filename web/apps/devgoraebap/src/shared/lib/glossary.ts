export const GLOSSARY_CATEGORIES = [
  "액션과 위계",
  "오버레이",
  "입력과 상태",
  "레이아웃과 밀도",
  "적응형 UI",
  "접근성",
  "디자인 시스템",
] as const;

export type GlossaryCategory = (typeof GLOSSARY_CATEGORIES)[number];

export interface GlossaryEntry {
  term: string;
  korean?: string;
  category: GlossaryCategory;
  definition: string;
  components?: string[];
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // 액션과 위계
  primary: {
    term: "Primary",
    korean: "주요",
    category: "액션과 위계",
    definition:
      "가장 강하게 강조하는 1순위 위계입니다. 버튼에서는 사용자가 가장 먼저 수행할 핵심 동작에 쓰고, 한 영역에 하나만 둡니다.",
    components: ["button"],
  },
  secondary: {
    term: "Secondary",
    korean: "보조",
    category: "액션과 위계",
    definition:
      "Primary 다음 순위의 위계입니다. 버튼에서는 핵심 동작을 돕는 동작에 써서 선택지의 우선순위를 나눕니다.",
    components: ["button"],
  },
  outline: {
    term: "Outline",
    korean: "아웃라인",
    category: "액션과 위계",
    definition:
      "채움 배경 대신 테두리로 경계를 드러내는 스타일입니다. 배경이 복잡한 영역에서 중립적인 보조 동작을 둘 때 씁니다.",
    components: ["button", "badge"],
  },
  ghost: {
    term: "Ghost",
    korean: "고스트",
    category: "액션과 위계",
    definition:
      "평소에는 배경과 테두리 없이 글자나 아이콘만 보이고, 포인터를 올리거나 누를 때 영역이 드러나는 스타일입니다.",
    components: ["button"],
  },
  destructive: {
    term: "Destructive",
    korean: "파괴적",
    category: "액션과 위계",
    definition:
      "삭제나 초기화처럼 데이터를 잃거나 되돌리기 어려운 동작을 경고하는 스타일입니다. 일반 완료 버튼과 구분해 실수를 줄입니다.",
    components: ["button", "alert-dialog"],
  },
  cta: {
    term: "CTA",
    category: "액션과 위계",
    definition:
      "Call to Action의 약자로, 가입·저장·구매처럼 화면의 최종 목표로 이어지는 대표 동작을 뜻합니다.",
    components: ["button"],
  },
  "visual-hierarchy": {
    term: "Visual Hierarchy",
    korean: "시각적 위계",
    category: "액션과 위계",
    definition:
      "크기, 굵기, 대비, 여백의 차이로 무엇이 더 중요한지 한눈에 읽히게 정리하는 설계 원칙입니다.",
  },
  affordance: {
    term: "Affordance",
    korean: "행동 유도성",
    category: "액션과 위계",
    definition:
      "눌러야 할지, 끌어야 할지, 입력해야 할지 외형만 보고 직관적으로 알 수 있는 시각적 단서입니다.",
    components: ["button", "switch", "slider"],
  },

  // 오버레이
  overlay: {
    term: "Overlay",
    korean: "오버레이",
    category: "오버레이",
    definition:
      "현재 화면 위에 한 층 겹쳐 뜨는 UI입니다. 작업의 중요도와 화면 폭에 따라 모달, 팝오버, 바텀시트로 나눕니다.",
    components: ["dialog", "popover", "bottom-sheet"],
  },
  modal: {
    term: "Modal",
    korean: "모달",
    category: "오버레이",
    definition:
      "배경 화면의 조작을 잠시 막고 사용자의 응답을 요구하는 오버레이입니다. 짧은 입력이나 중요한 확인에만 제한해 씁니다.",
    components: ["dialog", "alert-dialog"],
  },
  "non-modal": {
    term: "Non-modal",
    korean: "비모달",
    category: "오버레이",
    definition:
      "열려 있는 동안에도 배경 화면을 그대로 보거나 조작할 수 있는 오버레이입니다. 대표적으로 팝오버, 툴팁, 토스트가 있습니다.",
    components: ["popover", "tooltip", "toast"],
  },
  backdrop: {
    term: "Backdrop",
    korean: "백드롭",
    category: "오버레이",
    definition:
      "모달이나 시트 뒤의 본문을 반투명하게 가려 시선을 집중시키고 배경 클릭을 차단하는 막입니다.",
    components: ["dialog", "drawer", "bottom-sheet"],
  },
  "focus-trap": {
    term: "Focus Trap",
    korean: "포커스 트랩",
    category: "오버레이",
    definition:
      "모달이 열려 있을 때 Tab 키가 배경 화면으로 빠져나가지 않고 오버레이 안에서만 순환하도록 묶는 동작입니다.",
    components: ["dialog", "alert-dialog", "bottom-sheet"],
  },

  // 입력과 상태
  hover: {
    term: "Hover",
    korean: "호버",
    category: "입력과 상태",
    definition:
      "마우스 포인터가 요소 위에 올라간 상태입니다. 터치 기기에는 없으므로 필수 정보나 동작을 Hover에만 숨기지 않습니다.",
    components: ["tooltip", "preview-card", "button"],
  },
  focus: {
    term: "Focus",
    korean: "포커스",
    category: "입력과 상태",
    definition:
      "키보드나 클릭으로 현재 입력 대상이 된 상태입니다. 키보드 사용자가 자신의 위치를 잃지 않게 뚜렷한 표시가 필요합니다.",
    components: ["input", "button", "tabs"],
  },
  disabled: {
    term: "Disabled",
    korean: "비활성",
    category: "입력과 상태",
    definition:
      "조건이 맞지 않거나 권한이 없어 조작할 수 없는 상태입니다. 왜 비활성인지 알 수 있도록 주변 안내를 함께 둡니다.",
    components: ["button", "input", "switch"],
  },
  "loading-state": {
    term: "Loading State",
    korean: "로딩 상태",
    category: "입력과 상태",
    definition:
      "데이터를 불러오거나 요청을 처리하는 동안 진행 중임을 알리는 상태입니다. 레이아웃이 튀지 않게 자리를 미리 잡아 줍니다.",
    components: ["skeleton", "progress"],
  },
  "empty-state": {
    term: "Empty State",
    korean: "빈 상태",
    category: "입력과 상태",
    definition:
      "표시할 목록이나 검색 결과가 없을 때 보여 주는 화면입니다. 빈 영역 대신 원인과 다음 행동을 함께 안내합니다.",
    components: ["table", "combobox"],
  },
  validation: {
    term: "Validation",
    korean: "유효성 검사",
    category: "입력과 상태",
    definition:
      "입력값이 형식과 규칙에 맞는지 확인하고 오류를 알리는 과정입니다. 문제의 원인과 고치는 방법을 필드 가까이에 적습니다.",
    components: ["input", "textarea", "alert"],
  },

  // 레이아웃과 밀도
  "app-shell": {
    term: "App Shell",
    korean: "앱 셸",
    category: "레이아웃과 밀도",
    definition:
      "사이드바, 헤더, 본문 영역으로 이루어진 앱의 바깥 뼈대입니다. 페이지가 바뀌어도 탐색 구조가 흔들리지 않게 유지합니다.",
  },
  inset: {
    term: "Inset",
    korean: "인셋",
    category: "레이아웃과 밀도",
    definition:
      "사이드바와 본문 사이에 바깥 여백을 두고 본문을 둥근 면으로 띄워 구역을 구분하는 앱 셸 배치 방식입니다.",
  },
  gutter: {
    term: "Gutter",
    korean: "간격",
    category: "레이아웃과 밀도",
    definition:
      "그리드의 열과 열 사이에 두는 일정한 간격입니다. 화면 바깥쪽 여백인 Margin과 구분합니다.",
  },
  density: {
    term: "Density",
    korean: "밀도",
    category: "레이아웃과 밀도",
    definition:
      "한 화면에 정보를 얼마나 촘촘하게 담는지를 뜻합니다. 데이터 표는 높게, 읽기 화면은 낮게 맞추어 피로를 줄입니다.",
    components: ["table", "card"],
  },
  grid: {
    term: "Grid",
    korean: "그리드",
    category: "레이아웃과 밀도",
    definition:
      "화면을 일정한 열과 행의 기준으로 나누어 요소를 정렬하는 틀입니다. 화면 폭이 바뀌어도 균형 잡힌 배치를 유지합니다.",
  },
  "scrollbar-gutter": {
    term: "Scrollbar Gutter",
    korean: "스크롤바 여백",
    category: "레이아웃과 밀도",
    definition:
      "스크롤바가 생기거나 사라질 때 본문이 좌우로 흔들리지 않도록 미리 확보해 두는 여백 공간입니다.",
    components: ["scroll-area"],
  },

  // 적응형 UI
  responsive: {
    term: "Responsive UI",
    korean: "반응형 UI",
    category: "적응형 UI",
    definition:
      "화면 폭에 따라 열 개수, 여백, 글자 크기를 유연하게 조정하는 방식입니다. 같은 컴포넌트를 유지하면서 배치만 바꿉니다.",
  },
  adaptive: {
    term: "Adaptive UI",
    korean: "적응형 UI",
    category: "적응형 UI",
    definition:
      "기기 환경과 조작 방식에 맞춰 컴포넌트 표현 자체를 바꾸는 방식입니다. 모달을 바텀시트로 전환하는 패턴이 대표적입니다.",
    components: ["dialog", "popover", "bottom-sheet"],
  },
  breakpoint: {
    term: "Breakpoint",
    korean: "브레이크포인트",
    category: "적응형 UI",
    definition:
      "화면 레이아웃이나 컴포넌트 표현이 전환되는 기준 폭입니다. 일관된 경계를 정해 두어야 화면마다 전환 시점이 어긋나지 않습니다.",
  },
  "touch-target": {
    term: "Touch Target",
    korean: "터치 영역",
    category: "적응형 UI",
    definition:
      "손가락으로 정확히 누를 수 있는 최소 클릭 영역입니다. 모바일에서는 인접 항목 오입력을 막기 위해 44px 안팎을 권장합니다.",
    components: ["button", "switch", "checkbox"],
  },
  "safe-area": {
    term: "Safe Area",
    korean: "세이프 에어리어",
    category: "적응형 UI",
    definition:
      "모바일 기기의 노치, 상단 상태 바, 하단 홈 인디케이터에 가리지 않고 안전하게 콘텐츠를 놓을 수 있는 영역입니다.",
    components: ["bottom-sheet", "toast"],
  },
  dvh: {
    term: "dvh",
    category: "적응형 UI",
    definition:
      "Dynamic Viewport Height의 약자로, 모바일 브라우저의 주소창이 접히고 펴지는 변화를 반영하는 높이 단위입니다.",
    components: ["bottom-sheet", "dialog", "drawer"],
  },

  // 접근성
  aria: {
    term: "ARIA",
    category: "접근성",
    definition:
      "HTML 태그만으로 표현하기 어려운 UI의 역할과 상태를 보조 기기에 전달하는 속성 규격입니다.",
    components: ["dialog", "tabs", "switch"],
  },
  "screen-reader": {
    term: "Screen Reader",
    korean: "스크린 리더",
    category: "접근성",
    definition:
      "화면의 텍스트와 요소 역할을 음성이나 점자로 읽어 주는 보조 기기입니다. 시각적 단서 없이도 흐름을 이해할 수 있게 설계해야 합니다.",
    components: ["alert", "dialog", "button"],
  },
  "keyboard-navigation": {
    term: "Keyboard Navigation",
    korean: "키보드 내비게이션",
    category: "접근성",
    definition:
      "마우스 없이 Tab, 화살표, Enter, Esc만으로 화면의 모든 기능을 탐색하고 실행할 수 있는 조작 체계입니다.",
    components: ["tabs", "menu", "radio-group"],
  },
  "focus-ring": {
    term: "Focus Ring",
    korean: "포커스 링",
    category: "접근성",
    definition:
      "키보드로 요소에 접근했을 때 바깥에 표시되는 윤곽선입니다. 마우스 클릭 때는 과하게 보이지 않게 focus-visible 기준으로 제어합니다.",
    components: ["button", "input", "checkbox"],
  },
  "color-contrast": {
    term: "Color Contrast",
    korean: "명도 대비",
    category: "접근성",
    definition:
      "글자나 아이콘과 배경 사이의 밝기 차이입니다. 라이트와 다크 테마 모두에서 충분한 대비를 유지해야 가독성이 떨어지지 않습니다.",
    components: ["button", "badge", "alert"],
  },
  "accessible-name": {
    term: "Accessible Name",
    korean: "접근 가능한 이름",
    category: "접근성",
    definition:
      "스크린 리더가 요소를 식별해 읽어 주는 이름입니다. 텍스트가 없는 아이콘 버튼이나 입력 칸에는 aria-label이나 label을 꼭 연결합니다.",
    components: ["button", "input", "dialog"],
  },

  // 디자인 시스템
  "design-token": {
    term: "Design Token",
    korean: "디자인 토큰",
    category: "디자인 시스템",
    definition:
      "색상, 반경, 간격, 폰트 같은 시각적 결정을 이름으로 정의한 값입니다. 한곳의 토큰을 바꾸면 시스템 전체에 함께 반영됩니다.",
  },
  "semantic-token": {
    term: "Semantic Token",
    korean: "시맨틱 토큰",
    category: "디자인 시스템",
    definition:
      "색의 외형 대신 background, primary, destructive처럼 역할과 의도로 이름을 붙인 토큰입니다. 테마 전환의 기준이 됩니다.",
  },
  theme: {
    term: "Theme",
    korean: "테마",
    category: "디자인 시스템",
    definition:
      "같은 시맨틱 토큰 이름에 다른 값을 매핑해 화면의 분위기와 모드를 바꾸는 묶음입니다.",
  },
  recipe: {
    term: "Style Recipe",
    korean: "스타일 레시피",
    category: "디자인 시스템",
    definition:
      "컴포넌트의 기본 스타일과 크기·상태별 변형 규칙을 조합해 클래스로 반환하는 스타일 정의입니다.",
  },
  variant: {
    term: "Variant",
    korean: "변형",
    category: "디자인 시스템",
    definition:
      "같은 컴포넌트 안에서 역할이나 강조 수준에 따라 선택하는 스타일 변형입니다. 임의 스타일 대신 약속된 축으로 일관성을 지킵니다.",
    components: ["button", "badge", "alert"],
  },
  "headless-ui": {
    term: "Headless UI",
    korean: "헤드리스 UI",
    category: "디자인 시스템",
    definition:
      "시각 스타일 없이 키보드 탐색, 포커스 관리, 접근성 속성 같은 상호작용 동작만 제공하는 컴포넌트 계층입니다.",
    components: ["dialog", "select", "popover"],
  },
};

export type GlossarySegment = string | { id: string; label: string };

const TERM_MARKUP = /\[\[([\w-]+)\|([^\]]+)\]\]/g;

export function stripGlossaryMarkup(text: string) {
  return text.replace(TERM_MARKUP, "$2");
}

// 표시 없이 쓴 본문에서 찾을 말. 한국어 이름을 기준으로 두고, 약어와 굳어진 영어 표기만 함께 찾는다.
// 주요·보조·간격처럼 다른 뜻으로 흔히 쓰는 말은 넣지 않고 [[ ]] 표시로만 잇는다.
const AUTO_LINK: Record<string, string[]> = {
  cta: ["CTA"],
  "visual-hierarchy": ["시각적 위계"],
  affordance: ["행동 유도성"],
  overlay: ["오버레이"],
  modal: ["모달"],
  "non-modal": ["비모달"],
  backdrop: ["백드롭"],
  "focus-trap": ["포커스 트랩"],
  hover: ["호버"],
  focus: ["포커스"],
  "loading-state": ["로딩 상태"],
  "empty-state": ["빈 상태"],
  validation: ["유효성 검사"],
  "app-shell": ["앱 셸"],
  inset: ["인셋", "Inset"],
  grid: ["그리드"],
  "scrollbar-gutter": ["스크롤바 여백", "scrollbar-gutter"],
  responsive: ["반응형 UI", "반응형"],
  adaptive: ["적응형 UI", "적응형"],
  breakpoint: ["브레이크포인트", "분기점"],
  "touch-target": ["터치 영역"],
  "safe-area": ["세이프 에어리어", "Safe Area"],
  dvh: ["dvh"],
  aria: ["ARIA"],
  "screen-reader": ["스크린 리더"],
  "keyboard-navigation": ["키보드 내비게이션"],
  "focus-ring": ["포커스 링"],
  "color-contrast": ["명도 대비"],
  "accessible-name": ["접근 가능한 이름"],
  "design-token": ["디자인 토큰"],
  "semantic-token": ["시맨틱 토큰"],
  theme: ["테마"],
  recipe: ["스타일 레시피"],
  "headless-ui": ["헤드리스 UI"],
};

// 긴 말부터 찾아 포커스 링이 포커스보다, 비모달이 모달보다 먼저 잡히게 한다.
const AUTO_TERMS = Object.entries(AUTO_LINK)
  .flatMap(([id, words]) => words.map((word) => ({ id, word })))
  .sort((a, b) => b.word.length - a.word.length);
const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// 한글이나 영문자에 붙은 말(활성의 비활성, 100dvh)은 다른 낱말의 일부로 보고 건너뛴다.
const AUTO_PATTERN = new RegExp(
  `(?<![가-힣A-Za-z0-9-])(${AUTO_TERMS.map(({ word }) => escape(word)).join("|")})(?![A-Za-z0-9-])`,
  "g",
);
const AUTO_ID = new Map(AUTO_TERMS.map(({ id, word }) => [word, id]));

function linkPlain(text: string, seen: Set<string>, segments: GlossarySegment[]) {
  let cursor = 0;
  for (const match of text.matchAll(AUTO_PATTERN)) {
    const id = AUTO_ID.get(match[0])!;
    if (seen.has(id)) continue;
    seen.add(id);
    if (match.index > cursor) segments.push(text.slice(cursor, match.index));
    segments.push({ id, label: match[0] });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) segments.push(text.slice(cursor));
}

// [[용어 또는 컴포넌트 키|문장에 보일 글]] 표시와 본문 속 용어 이름 중 페이지에서 처음 나온 것만 용어집에 잇는다.
export function annotateGlossary(texts: [string, string][], componentIds = new Set<string>()) {
  const seen = new Set<string>();
  const result: Record<string, GlossarySegment[]> = {};
  for (const [key, text] of texts) {
    const segments: GlossarySegment[] = [];
    let cursor = 0;
    for (const match of text.matchAll(TERM_MARKUP)) {
      const [markup, id, label] = match;
      linkPlain(text.slice(cursor, match.index), seen, segments);
      if ((GLOSSARY[id] || componentIds.has(id)) && !seen.has(id)) {
        seen.add(id);
        segments.push({ id, label });
      } else {
        segments.push(label);
      }
      cursor = match.index + markup.length;
    }
    linkPlain(text.slice(cursor), seen, segments);
    result[key] = segments;
  }
  return result;
}

// 표시 없는 본문 한 조각을 잇는다. 같은 seen을 넘기면 여러 조각에 걸쳐 용어마다 처음 나온 곳만 잇는다.
export function annotatePlain(text: string, seen: Set<string>) {
  const segments: GlossarySegment[] = [];
  linkPlain(text, seen, segments);
  return segments;
}
