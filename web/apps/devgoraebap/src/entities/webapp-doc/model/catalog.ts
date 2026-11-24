import type { SystemIconName } from "@goraebap/ui-react/icons";

export interface DocSection {
  id: string;
  title?: string;
  paragraphs: string[];
  bullets?: { after: number; items: string[] };
  callout?: { after: number; title?: string; body: string };
  example?: { after: number; label: string; code: string; caption?: string };
  diagram?: { after: number; code: string; caption: string };
  table?: {
    after: number;
    columns: string[];
    rows: string[][];
    monoFirstColumn?: boolean;
  };
}

export interface GuideDoc {
  slug: string;
  title: string;
  icon: SystemIconName;
  summary: string;
  sections: DocSection[];
  next?: { label: string; to?: string };
  references?: { title: string; source: string; href: string; note: string }[];
  // 이 글이 옮긴 Webapp 플러그인 지침. plugins/webapp/skills 기준 경로
  skills?: string[];
}

export interface GuideGroup {
  title: string;
  docs: GuideDoc[];
}

// 프론트엔드 개발 이야기. frontend Engineering 개요
const FRONTEND_STORY: GuideDoc = {
  slug: "overview",
  title: "개요",
  icon: "components",
  summary: "프론트엔드를 분리했다가 걷어 내고, 다시 분리하기까지의 경험",
  sections: [
    {
      id: "split-and-fatigue",
      title: "JSP에서 프론트엔드 분리, 그리고 피로",
      paragraphs: [
        "제가 처음 만든 웹 애플리케이션은 Spring 프레임워크에 JSP 템플릿 엔진과 jQuery를 조합한 사이트였습니다. 이후 React를 접하고 나서는 기존 방식으로 돌아가기 어려울 만큼 프론트엔드를 분리하는 작업에 재미를 느꼈고, 그 뒤로는 Angular를 주력으로 프론트엔드 분리 방식을 오랫동안 고수했습니다.",
        "그러다 어느샌가 프론트엔드를 분리해 작업하는 방식에 피로감을 느끼기 시작했습니다. 프론트엔드와 백엔드 모두 나름의 이유를 가지고 공을 들여 만들었지만, 완성된 결과물에는 늘 아쉬운 구석이 남았습니다. 시각적인 감각은 어느 정도 있다고 생각해 무엇이 부족한지는 어렴풋이 느끼고 있었고, 다른 사이트들과 비교하며 그 차이를 확인했지만, 그 마감을 끝까지 챙기는 데에도 상당한 비용이 들었습니다.",
      ],
    },
    {
      id: "hda-and-colocation",
      title: "HDA 시도와 코로케이션의 빈자리",
      paragraphs: [
        "그래서 백엔드 프레임워크에 htmx 같은 HDA(Hypermedia-Driven Application) 방식을 얹어 적은 비용으로 SPA 같은 경험을 내는 접근에 한동안 빠졌습니다. 하지만 소스코드가 적다고 해서 관리 방식까지 우아한 것은 아니라는 사실을 깨달았습니다. 프론트엔드 프레임워크를 쓸 때 당연했던 컴포넌트의 응집도, 즉 HTML·CSS·JS 로직이 한곳에 모여 있는 코로케이션(colocation)이 늘 아쉬웠고, 이를 억지로 보완하려고 추가 설정을 붙이는 과정도 만족스럽지 않았습니다.",
        "또 htmx가 해결하지 못하는 영역에서 JavaScript를 직접 써야 할 때면 다시 npm 진영의 라이브러리가 그리워졌고, TypeScript나 JavaScript 안에서 createElement를 호출하거나 백틱 문자열 안에 HTML을 넣는 상황이 반복되며 급격히 피로가 쌓였습니다. 프론트엔드 프레임워크가 지나치게 복잡하고 대부분의 웹 애플리케이션에는 필요하지 않을지 모른다는 글에 공감하기도 했지만, 복잡도가 과한 것과 개발 경험(DX)은 또 다른 이야기라고 생각하게 되었습니다.",
      ],
    },
    {
      id: "back-to-split",
      title: "AI 에이전트와 다시 분리로",
      paragraphs: [
        "결국 AI 에이전트가 일상에 들어와 구현 비용이 압도적으로 낮아지면서 다시 프론트엔드를 분리하는 구조로 돌아왔습니다. 나중에 HDA 진영에 더 나은 패러다임이 나온다면 다시 시도해 볼 의향은 있지만, 이제는 개발 비용보다 구조와 마감 기준을 일관되게 유지하는 쪽에 더 무게를 두고 있습니다.",
      ],
    },
    {
      id: "now",
      title: "지금의 방식",
      paragraphs: [
        "다시 프론트엔드를 분리해 작업하는 지금, 저는 코로케이션과 개발 경험을 지키면서도 예전에 지쳤던 마감 비용을 줄이기 위해 화면 구조와 데이터 흐름을 미리 규칙으로 묶어 두고 있습니다. FSD 다섯 층과 주소 기반 라우팅으로 코드 자리를 고정하고, 서버 데이터·URL·입력 초안의 소유자를 나누어 상태가 얽히지 않게 합니다.",
        "프론트엔드 문서에는 이러한 구조와 코드 규칙, 상태 소유와 데이터 흐름, 화면 전환과 리소스 주소 기준이 정리되어 있고, 화면 표현과 상호작용 마감은 Design System과 Interaction로 따로 묶어 두었습니다. 여기서 정리한 규칙들은 고정된 정답이 아니라 프로젝트를 만들며 부딪히는 문제에 맞춰 계속 고쳐 가는 지금의 답입니다.",
      ],
    },
  ],
};

// 백엔드 개발 이야기. backend Engineering 개요
const BACKEND_STORY: GuideDoc = {
  slug: "overview",
  title: "개요",
  icon: "code",
  summary: "백엔드 기술을 고르고 구조를 고민해 온 과정",
  sections: [
    {
      id: "stack-unification",
      title: "Spring에서 TypeScript와 NestJS로",
      paragraphs: [
        "백엔드를 Spring으로 시작했지만, 별도의 프론트엔드 프레임워크를 늘 함께 도입하게 되면서 기술 스택을 통일하고 싶어졌습니다. 프론트엔드에서 JavaScript와 TypeScript를 반드시 써야 하는 만큼, 인지 비용을 줄이려면 백엔드도 Node.js 기반 프레임워크를 쓰는 편이 낫다고 생각했습니다. OOP에 꾸준한 관심이 있었기 때문에 Spring을 쓰지 않더라도 TypeScript 진영에서 DI와 IoC를 지원하는 NestJS가 거의 유일한 선택지가 되었습니다.",
      ],
    },
    {
      id: "feature-first",
      title: "레이어보다 기능을 1차 기준으로",
      paragraphs: [
        "프론트엔드 진영은 여러 구조를 거치며 FSD(Feature-Sliced Design)가 저와 잘 맞아 정착했지만, 백엔드는 여전히 구조적인 고민이 끊이지 않습니다. 지금 와서 그 이유를 돌이켜 보면 일관성과 유연성 사이에서 선을 긋기가 어렵고, 만들고자 하는 도메인을 제대로 파악해야 비로소 깔끔한 컨텍스트를 나눌 수 있기 때문이라고 생각합니다.",
        "저는 DDD가 다루는 개념과 클린 아키텍처의 일부를 좋아하지만, 이를 가장 엄격하게 구현하는 헥사고날 아키텍처는 늘 과하게 느껴졌습니다. 분명한 것은 레이어를 1차 기준으로 패키지를 나누는 것보다 기능을 1차 기준으로 나누는 편이 낫다는 점입니다. 다만 기능 단위로 패키지를 나누면 서로 참조할 수밖에 없고, 저는 그 관계를 깔끔하게 드러내고 싶었습니다.",
      ],
      diagram: {
        after: 1,
        caption: "기능을 먼저 나누고, 하위 도메인 사이는 한 방향으로만 참조하려 합니다.",
        code: `flowchart LR
  subgraph layered["레이어 우선"]
    direction TB
    controller --> service --> repository
  end
  subgraph featured["기능 우선"]
    direction TB
    core["핵심 하위 도메인"] --> supporting["지원 하위 도메인"]
    core --> generic["일반 하위 도메인"]
    supporting --> generic
  end
  layered -- "기능을 1차 기준으로" --> featured`,
      },
    },
    {
      id: "unidirectional",
      title: "단방향 참조와 AI 시대의 구조 감각",
      paragraphs: [
        "그러다 보니 자연스럽게 DDD의 핵심(core), 지원(supporting), 일반(generic) 하위 도메인 개념을 접하게 되었고, 도메인의 성격에 따라 패키지 간 참조 패턴도 어느 정도 정해진다고 보게 되었습니다.",
        "다만 프론트엔드의 FSD와 달리 백엔드에서는 도메인 패키지 안에서 기능이나 컨텍스트 패키지끼리 서로 참조하는 것이 기술적으로 허용됩니다. 기능상 문제가 없더라도 컨텍스트가 서로 참조하는 구조는 좋지 않다고 믿기 때문에, 단방향 참조를 지키기 위한 구조 고민이 끝없이 이어집니다. 그래서 AI 시대인 지금도 코드가 마구잡이로 쌓이는 것을 참기 어렵고, 제가 의도한 구조대로 AI가 만들어 주기를 바랍니다. 이런 이유로 제 백엔드는 지금도 OOP를 지원하는 언어와 프레임워크 조합을 주로 선택하게 됩니다.",
      ],
    },
    {
      id: "now",
      title: "지금의 방식",
      paragraphs: [
        "기능을 1차 기준으로 나누고 단방향 참조를 지키려는 생각은 지금 모듈형 모놀리스 규칙으로 정리되었습니다. 각 모듈은 내부 계층을 감추고 루트의 공개 계약으로만 소통하며, 쓰기는 도메인 저장소와 업무 메서드로, 읽기는 전용 조회 포트로 경로를 나누어 경계가 흐려지지 않게 합니다.",
        "백엔드 문서에는 모듈 구조와 계약·공유·조회 경계부터 코드 규칙, 오류와 접근 판정, API 계약, DB 마이그레이션까지 실무에서 반복해 쓰는 기준이 정리되어 있습니다. 이 규칙들 역시 완성된 답이 아니라 실제 서비스를 만들고 운영하면서 계속 다듬어 가는 지금의 답입니다.",
      ],
    },
  ],
};

// frontend 공간의 Engineering 문서. Webapp 플러그인의 frontend 지침을 사람이 읽는 글로 옮긴다.
export const FRONTEND_ENGINEERING_GROUPS: GuideGroup[] = [
  {
    title: "",
    docs: [FRONTEND_STORY],
  },
  {
    title: "구조",
    docs: [
      {
        slug: "layers",
        title: "화면 계층",
        icon: "layouts",
        skills: ["frontend-engineering/references/structure.md"],
        summary: "FSD 다섯 층과 주소 기반 pages, 키트·앱 셸의 경계를 나누는 기준",
        sections: [
          {
            id: "fsd-five-layers",
            title: "다섯 층과 widgets를 두지 않는 이유",
            paragraphs: [
              "프론트엔드는 FSD의 다섯 층인 app, pages, features, entities, shared로 나누고 widgets 층은 두지 않습니다. 상위 층은 하위 층만 참조하며, 개발 이야기에서 중시한 코로케이션을 살려 슬라이스 안에서 컴포넌트는 파일 하나에 하나씩 둡니다.",
              "여러 파일이 함께 쓰는 훅과 로직은 슬라이스의 model에 모으고, 한 파일에서만 쓰는 작은 조각은 억지로 파일을 나누지 않고 그 파일 위쪽에 둡니다.",
            ],
            table: {
              after: 1,
              columns: ["층", "역할"],
              rows: [
                ["app", "진입점, 전역 프로바이더, 공간·메뉴·권한을 아는 앱 셸"],
                ["pages", "주소별 화면과 부모 경로, 폴더 하나가 주소 하나"],
                ["features", "여러 화면에서 재사용하는 사용자 동작과 상호작용"],
                ["entities", "도메인 모델, 조회 옵션, 표시 컴포넌트"],
                ["shared", "업무를 모르는 UI 키트, 제품 공용 컴포넌트, 기본 유틸"],
              ],
              monoFirstColumn: true,
            },
          },
          {
            id: "pages-as-routes",
            title: "주소가 곧 pages 슬라이스",
            paragraphs: [
              "pages는 화면을 모아 두는 일반 폴더가 아니라 주소입니다. 폴더 하나가 주소 하나이자 슬라이스 하나라서, 폴더 구조만 보면 앱의 주소가 보입니다. 주소를 등록하는 방법은 라우터를 따릅니다. React에서는 라우터의 파일 라우팅이 pages 폴더를 읽고, 파일 라우팅이 없는 Angular에서는 폴더마다 라우트 파일을 두고 부모가 자식 폴더의 것을 잇습니다. 어느 쪽이든 폴더마다 아래 주소들의 레이아웃·가드·데이터 준비를 맡는 부모 경로와 그 주소의 화면 파일을 나눠 둡니다. 주소에 나타나지 않는 묶음 폴더로 여러 주소에 같은 틀을 걸고, ui·model 같은 슬라이스 세그먼트와 공개 진입점은 라우트로 읽지 않게 설정합니다.",
              "pages 안의 파일은 자기 라우트 폴더와 조상 라우트 폴더의 것만 가져옵니다. 형제 주소의 코드는 가져오지 않으며, 두 주소가 함께 쓰는 코드는 공통 조상 폴더로 올립니다. 공간이 여럿인 앱은 공간마다 pages 아래 폴더를 두어 주소로 묶되, features와 entities는 공간별로 나누지 않습니다.",
            ],
            diagram: {
              after: 1,
              caption:
                "pages는 자기 폴더와 조상 폴더만 참조하고 형제 주소끼리는 참조하지 않습니다.",
              code: `flowchart TB
  parent["pages/space/ (공통 조상)"] --> a["pages/space/items/"]
  parent --> b["pages/space/settings/"]
  a -. "형제 참조 금지" .-> b`,
            },
            example: {
              after: 1,
              label: "pages 폴더 구조 (파일 라우팅의 예)",
              code: `pages/
  __root.tsx          # 전역 루트
  space/
    route.tsx         # 부모 경로 (레이아웃·가드·데이터 준비)
    items/
      page.tsx        # 목록 화면
      $id/
        page.tsx      # 상세 화면
      ui/             # 라우트로 읽지 않는 슬라이스 세그먼트
      model/`,
            },
          },
          {
            id: "shared-and-app",
            title: "키트, 제품 공용, 앱 셸의 경계",
            paragraphs: [
              "shared 층 안에서도 UI 키트와 제품이 만든 공용 컴포넌트는 서로 다른 폴더로 나눕니다. 업무를 모르는 레이아웃 뼈대인 앱 셸 틀, 페이지, 분할 보기, 칸 머리, 모바일 도구는 키트 안의 레이아웃 폴더에 모으고, 공간·메뉴 항목·권한에 따른 관리 진입처럼 업무를 아는 앱 셸은 app 층에 둡니다.",
              "분할 화면의 진입부와 목록 줄, 위 단계 경로, 버릴지 묻는 창, 양식 바닥 같은 패턴의 공통 뼈대는 한 곳에 두고 화면마다 다시 조립하지 않습니다. 개별 화면은 줄, 도구, 칸 내용만 넘깁니다.",
            ],
            callout: {
              after: 1,
              title: "화면 표현과의 경계",
              body: "레이아웃과 컴포넌트의 시각·반응형 표현 기준은 frontend의 Layouts와 Interaction에서 다루고, 여기서는 코드 배치와 소유 경계에 집중합니다.",
            },
          },
          {
            id: "rendering",
            title: "렌더링은 브라우저에서, 공개 페이지만 정적 생성",
            paragraphs: [
              "제가 만드는 화면은 대부분 로그인 뒤에만 보이는 업무 화면이라 검색에 노출할 이유가 없습니다. 그래서 기본은 브라우저에서 그리는 방식(CSR)으로 두고, 빌드한 정적 파일을 nginx로 내보냅니다. 서버 렌더링을 켜면 Node 서버를 따로 운영해야 하는 비용만 생깁니다.",
              "랜딩이나 문서처럼 검색 노출과 첫 화면 속도가 필요한 공개 페이지는 빌드 때 HTML을 만드는 정적 생성(SSG)을 먼저 검토합니다. 정적 파일 배포를 그대로 쓸 수 있기 때문입니다. 요청마다 서버에서 그리는 렌더링(SSR)은 요청마다 내용이 달라지는 공개 화면처럼 정적 생성으로 풀리지 않는 요구가 생겼을 때만 들이고, 그때는 운영할 서버와 배포 방식을 함께 정합니다.",
            ],
            table: {
              after: 1,
              columns: ["화면", "렌더링", "배포"],
              rows: [
                ["로그인 뒤 업무 화면", "CSR", "정적 파일"],
                ["랜딩·문서 같은 공개 페이지", "SSG를 먼저 검토", "정적 파일"],
                ["요청마다 달라지는 공개 화면", "SSR (요구가 있을 때만)", "운영 서버 필요"],
              ],
            },
          },
        ],
      },
      {
        slug: "code-style",
        title: "코드 규칙",
        icon: "code",
        skills: ["frontend-engineering/references/structure.md"],
        summary: "파일 이름 규칙, 파생값과 Effect 경계, 메모이제이션과 수명주기 기준",
        sections: [
          {
            id: "naming-and-files",
            title: "파일과 이름 규칙",
            paragraphs: [
              "파일 배치와 공개 API는 FSD 규칙을 따르며, 컴포넌트는 PascalCase 파일 하나에 하나씩 둡니다. 페이지 컴포넌트에는 Page 접미를 붙이고, 훅은 use로 시작하고, 훅·유틸·설정 파일 이름은 kebab-case로 적습니다.",
              "라우트 묶음 폴더, 경로 별칭, 린트 규칙은 프로젝트마다 다를 수 있으므로 작업 전에 현재 프로젝트 설정을 먼저 확인하고 다른 프로젝트의 도우미나 그룹이 있다고 가정하지 않습니다.",
            ],
            table: {
              after: 0,
              columns: ["대상", "이름 규칙"],
              rows: [
                ["컴포넌트", "PascalCase, 파일 하나에 컴포넌트 하나"],
                ["페이지", "Page 접미사"],
                ["훅", "use 접두사, 파일은 kebab-case"],
                ["유틸 · 설정", "kebab-case"],
              ],
            },
            example: {
              after: 1,
              label: "슬라이스 안 파일 이름 예시",
              code: `items/
  ItemsPage.tsx
  ui/
    ItemRow.tsx
  model/
    use-item-filter.ts
  lib/
    format-date.ts`,
            },
          },
          {
            id: "effects-and-memo",
            title: "Effect, 파생값, 메모이제이션",
            paragraphs: [
              "기존 props나 state에서 계산할 수 있는 파생값을 별도 state에 복사해 Effect로 맞추지 않습니다. 사용자 클릭이나 제출 같은 명령은 이벤트 핸들러와 mutation이 처리하고, Effect는 외부 구독과 동기화에만 쓰며 정리 함수로 반드시 해제합니다.",
              "값과 함수의 메모이제이션은 모든 곳에 습관적으로 붙이지 않고, 측정된 비용이 있거나 참조 안정성이 필요한 경계에서만 씁니다. 개발 모드의 이중 실행 검사에서 드러난 수명주기 문제는 실행 방지 플래그로 덮지 않고 원인 자체를 고칩니다.",
            ],
            diagram: {
              after: 0,
              caption: "로직의 성격에 따라 렌더 계산, 이벤트 핸들러, Effect로 자리를 나눕니다.",
              code: `flowchart LR
  q{"무엇을 하는 로직인가"} --> derived["기존 값의 파생<br/>렌더 중 바로 계산"]
  q --> action["사용자 명령<br/>이벤트 핸들러 · mutation"]
  q --> sub["외부 구독 · 동기화<br/>Effect + 해제"]`,
            },
            table: {
              after: 1,
              columns: ["상황", "처리 기준"],
              rows: [
                ["파생값 계산", "state로 복사하지 않고 렌더 중에 직접 계산"],
                ["사용자 동작", "Effect가 아니라 이벤트 핸들러·mutation에서 실행"],
                ["메모이제이션", "측정된 비용 또는 참조 안정성이 필요한 경계에만 사용"],
                ["이중 실행 오류", "실행 방지 플래그로 숨기지 않고 수명주기 원인을 수정"],
              ],
            },
          },
        ],
      },
    ],
  },
  {
    title: "데이터",
    docs: [
      {
        slug: "state",
        title: "상태 소유",
        icon: "swatch",
        skills: ["frontend-engineering/references/data-flow.md"],
        summary:
          "서버 데이터, URL, 입력 초안의 소유자를 나누고 저장 중 편집을 안전하게 지키는 기준",
        sections: [
          {
            id: "state-owners",
            title: "상태별 소유자 구분",
            paragraphs: [
              "프론트엔드 상태가 꼬이는 가장 흔한 원인은 같은 값을 여러 곳에 복제해 두고 서로 맞추려 할 때입니다. 저는 상태를 서버 데이터, 확정된 URL 조건, 임시 입력 초안 세 가지로 나누고 각자 하나의 소유자에게 맡깁니다.",
            ],
            table: {
              after: 0,
              columns: ["상태", "소유자"],
              rows: [
                ["서버 데이터 · 캐시", "서버 데이터 캐시 도구 (TanStack Query 등)"],
                ["경로 · 확정 필터 · 정렬 · 페이지 · 탭", "라우터가 검증한 URL"],
                ["입력 초안 · 적용 전 필터 · 열림 상태", "로컬 state 또는 해당 슬라이스 model"],
              ],
            },
            diagram: {
              after: 0,
              caption: "상태마다 원본 소유자를 하나로 정해 중복 복사를 막습니다.",
              code: `flowchart LR
  server["서버 데이터 · 캐시"] --> query["캐시 도구"]
  route["경로 · 확정 필터 · 탭"] --> url["검증된 URL"]
  draft["입력 초안 · 열림 상태"] --> local["로컬 state · 슬라이스 model"]`,
            },
          },
          {
            id: "server-and-draft",
            title: "서버 데이터와 초안 분리",
            paragraphs: [
              "서버에서 읽어 온 원본 데이터와 사용자가 고치는 수정 초안은 분리합니다. 백그라운드 재조회가 돌아도 입력 중인 초안을 덮어쓰지 않으며, 저장 충돌이 나면 초안을 버리지 않고 유지한 채 다시 읽기나 재적용 방법을 제공합니다.",
              "저장 요청이 진행 중인 동안에도 계속 편집할 수 있는 화면이라면, 저장 요청에 실어 보낸 초안 판본과 현재 편집 중인 초안을 구분합니다. 그래야 늦게 도착한 이전 저장의 성공 응답이 이후에 입력한 내용을 초기화하지 않습니다.",
            ],
            bullets: {
              after: 1,
              items: [
                "백그라운드 재조회가 사용자의 현재 입력 초안을 덮지 않게 분리합니다.",
                "저장 중 편집을 허용하면 요청 판본과 현재 판본을 비교해 지연 응답을 걸러냅니다.",
                "연속 저장의 직렬화·충돌·재시도 정책을 정하고, 문서나 계정이 바뀐 뒤 도착한 응답도 격리합니다.",
              ],
            },
          },
          {
            id: "filter-and-url",
            title: "필터 확정과 URL 동기화",
            paragraphs: [
              "필터를 확정할 때는 URL 갱신, 페이지 번호 초기화, 조회 키 변경을 하나의 상태 전환으로 다룹니다. 적용 버튼을 누르기 전의 선택은 초안이며, 취소하면 기존 URL을 그대로 유지합니다.",
              "URL에서 읽는 숫자, 날짜, 열거형과 기본값은 라우터 경계에서 검증해 새로고침, 링크 공유, 뒤로가기에서도 같은 조건이 복원되게 합니다. 칩, 선택기, 모바일 시트의 표현은 Interaction와 컴포넌트 문서에서 다룹니다.",
            ],
            callout: {
              after: 1,
              title: "초안과 확정의 경계",
              body: "적용 전 필터는 로컬 초안에 두고, 확정하는 순간에만 URL을 바꿔 페이지를 초기화하고 조회를 갱신합니다.",
            },
          },
        ],
      },
      {
        slug: "data-flow",
        title: "조회와 변경",
        icon: "transition",
        skills: ["frontend-engineering/references/data-flow.md"],
        summary: "조회 옵션 공유, 준비 함수, mutation 후 무효화, 계정 전환과 목록 정책 기준",
        sections: [
          {
            id: "query-options",
            title: "조회 옵션, 캐시 키, 준비 함수",
            paragraphs: [
              "조회를 소유한 슬라이스의 api에 요청 함수, 캐시 키, 조회 옵션을 함께 둡니다. 라우트의 데이터 준비(loader)와 화면 컴포넌트는 같은 조회 옵션을 쓰며, 응답을 바꾸는 모든 인자를 캐시 키에 빠짐없이 넣습니다.",
              "캐시에서 꺼낸 값이 항상 최신 응답이라고 가정하지 않고, 최신 응답을 기다려야 하면 그 조회의 신선도 기준을 명시합니다. 라우트의 데이터 준비는 실패하면 준비가 멈추는 필수 조회와 실패해도 넘어가는 선택 조회를 나눈 준비 함수 하나로 정리합니다.",
            ],
            diagram: {
              after: 1,
              caption: "슬라이스 api의 조회 옵션 하나를 loader와 페이지가 함께 씁니다.",
              code: `flowchart LR
  opts["슬라이스 api<br/>요청 · 캐시 키 · 조회 옵션"] --> loader["라우트 loader<br/>필수 조회 · 선택 조회 분기"]
  opts --> page["페이지 컴포넌트"]
  loader --> cache["서버 데이터 캐시"]
  cache --> page`,
            },
          },
          {
            id: "mutation-and-invalidation",
            title: "변경과 캐시 무효화",
            paragraphs: [
              "기본 변경 흐름은 mutation이 성공한 뒤 관련된 캐시 키를 무효화하는 방식입니다. 저장은 성공했는데 뒤따른 재조회만 실패한 상황을 저장 실패로 오인해 알리지 않도록 구분합니다.",
              "낙관적 갱신과 명령 자동 재시도는 기본으로 켜지 않고 중복 실행 위험과 복구 비용을 따져 필요한 곳에만 고릅니다. 하위 컴포넌트가 페이지의 캐시 키를 직접 알지 않도록 콜백을 넘기거나 상태 소유자를 조정합니다.",
            ],
          },
          {
            id: "states-and-lists",
            title: "상태 구분, 계정 전환, 큰 목록",
            paragraphs: [
              "초기 로딩, 정상 빈 결과, 조회 오류는 분명히 구분해 처리합니다(상태별 화면 표현은 Interaction의 화면 상태에서 다룹니다). 계정이나 권한이 바뀌는 순간에는 이전 범위의 데이터가 노출되지 않도록 진행 중인 조회를 취소하고 캐시를 비웁니다.",
              "큰 목록은 브라우저에서 전체를 내려받지 않고 서버에서 필터, 정렬, 페이지를 처리합니다. 무한 목록은 보관 중인 페이지 조각 전체가 한꺼번에 재조회되는 비용을 확인하고 목록 복귀, 새 진입, 갱신 정책을 따로 정합니다.",
            ],
            table: {
              after: 1,
              columns: ["상황", "처리 기준"],
              rows: [
                ["조회 결과 구분", "초기 로딩, 정상 빈 결과, 조회 오류를 서로 섞지 않음"],
                ["계정 · 권한 전환", "진행 중 조회 취소와 이전 범위 캐시 제거"],
                ["큰 목록", "서버에서 필터, 정렬, 페이징 처리"],
                ["무한 목록", "조각 전체 재조회 비용을 확인하고 복귀·새 진입·갱신 정책 분리"],
              ],
            },
          },
        ],
      },
    ],
  },
  {
    title: "라우팅",
    docs: [
      {
        slug: "navigation",
        title: "화면 전환",
        icon: "route",
        skills: ["frontend-engineering/references/navigation.md"],
        summary: "intent prefetch, stale-while-revalidate, 지연 로딩 준비와 목록 복귀 기준",
        sections: [
          {
            id: "prefetch-and-swr",
            title: "미리 준비, 캐시 우선 표시, 지연 진행 표시",
            paragraphs: [
              "첫 화면에 필요한 조회는 라우트 loader에서 컴포넌트와 같은 조회 옵션으로 준비합니다. 캐시가 있으면 오래됐더라도 즉시 그리고 뒤에서 갱신하는 stale-while-revalidate를 기본으로 삼으며, 캐시 신선도 조건 때문에 첫 그림을 막지 않습니다. 캐시로 먼저 그린 본문이 서버 최신본과 다르면 읽던 글을 갑자기 덮지 않고 최신 내용 보기 안내만 띄웁니다.",
              "앱 안 링크에 포인터나 초점이 오면 그 화면을 미리 준비하는 intent prefetch를 씁니다. 링크마다 붙이지 않고 문서에 한 번 걸어 pointerover와 focusin에서 앱 안 링크를 라우터로 미리 준비하며, 같은 주소는 10초에 한 번만 호출합니다. 캐시가 없으면 다음 화면이 준비될 때까지 지금 화면을 유지하고 150ms가 지나면 콘텐츠 카드 위 테두리에만 진행 표시를 띄웁니다(화면 표현은 Interaction에서 다룹니다).",
            ],
            diagram: {
              after: 1,
              caption:
                "링크 호버·포커스로 미리 준비하고, 캐시 유무에 따라 즉시 표시와 지연 진행 표시로 나눕니다.",
              code: `flowchart LR
  hover["링크 호버 · 포커스"] --> pre["intent prefetch<br/>같은 주소 10초 1회"]
  click["링크 클릭"] --> has{"캐시가 있는가"}
  has -- "있음" --> swr["즉시 표시 후<br/>뒤에서 갱신"]
  has -- "없음" --> hold["현재 화면 유지<br/>150ms 후 상단 진행 표시"]`,
            },
          },
          {
            id: "code-preloading",
            title: "지연 로딩 코드와 데이터 함께 준비",
            paragraphs: [
              "지연 로딩하는 화면 코드와 중첩 화면, 리치 에디터처럼 큰 컴포넌트도 데이터와 함께 전환 전에 미리 받습니다. 바깥 라우트만 준비하고 안쪽 지연 로딩 컴포넌트가 렌더 중에 처음 로드되면 가장 가까운 대기 경계가 앱 셸까지 숨기거나 에디터가 뒤늦게 붙으며 아래 영역이 밀립니다.",
              "본문뿐 아니라 첫 화면에 필요한 목록, 사람, 선택지, 연결 정보도 같은 조회 옵션으로 함께 준비합니다. 라우터가 loader 결과를 기억하는 기간과 서버 데이터 캐시의 수명을 따로 정해, loader가 생략된 뒤 빈 캐시에서 화면이 다시 조회하는 일을 막습니다.",
            ],
            bullets: {
              after: 1,
              items: [
                "지연 로딩 컴포넌트는 미리 받는 함수를 가진 래퍼로 감싸 받은 뒤에는 멈춤 없이 바로 그리게 합니다.",
                "배치에 영향을 주는 비동기 컴포넌트는 빈 채로 먼저 그렸다가 나중에 채우지 않습니다.",
                "새 경로 일치 시점과 이동 완료 시점을 구분하고, 이전 주소를 넘겨 본문을 다시 마운트하지 않습니다.",
              ],
            },
          },
          {
            id: "history-and-return",
            title: "검색 기록, 목록 복귀, 이동 중인 주소",
            paragraphs: [
              "검색 조건과 탭은 검증된 URL에서 읽으며, 입력 중 검색처럼 중간 단계가 쌓이는 변경은 replace로, 사용자가 구분해 돌아올 이동은 push로 기록합니다. 뒤로 돌아온 목록은 읽던 스크롤 위치와 이미 로드한 행을 유지해 새 진입의 최신성 정책과 섞지 않습니다.",
              "사이드바 메뉴와 선택 표시는 이동이 끝난 주소가 아니라 이동 중인 주소로 계산합니다. 이동이 끝난 주소를 쓰면 다음 화면의 loader가 끝날 때까지 메뉴가 이전 공간에 머물러 반응이 한 박자 늦어집니다.",
            ],
            table: {
              after: 1,
              columns: ["상황", "처리 기준"],
              rows: [
                ["입력 중 검색 조건 변경", "히스토리 replace로 중간 단계 누적 방지"],
                ["구분해서 돌아올 화면 이동", "히스토리 push로 기록 유지"],
                ["목록으로 뒤로 복귀", "읽던 위치와 로드한 행 유지"],
                ["사이드바 메뉴 활성 표시", "응답 완료 전 이동 중인 주소 기준으로 즉시 반영"],
              ],
            },
          },
        ],
      },
      {
        slug: "resource-routes",
        title: "리소스 주소",
        icon: "file",
        skills: [
          "frontend-engineering/references/navigation.md",
          "frontend-design-system/references/resource-patterns.md",
        ],
        summary: "리소스 화면 패턴별 주소 계약, 대화상자 내부 이동과 마스킹, 공간 주소 기준",
        sections: [
          {
            id: "resource-patterns",
            title: "직접 주소와 세 가지 리소스 패턴",
            paragraphs: [
              "목록 위에서 패널이나 모달로 상세를 열더라도 대상에는 반드시 직접 접근할 수 있는 주소를 둡니다. 직접 URL 진입이나 새로고침에서는 독립 화면으로 열리며, 닫기는 이전 맥락을 복구하되 이전 기록이 없으면 무조건 브라우저 뒤로가기를 부르지 않고 해당 목록으로 가는 명시적인 대체 경로로 이동합니다.",
              "리소스의 목록·상세·생성·수정 주소는 List-Detail, Drill-down, Routed Modal 세 패턴에 맞춰 짭니다. 전체 페이지와 상세 패널이 같은 대상을 열면 조회와 화면 컴포넌트를 공유하고, 데모나 플레이그라운드도 제품 컴포넌트에 가짜 데이터만 연결합니다.",
            ],
            table: {
              after: 1,
              columns: ["패턴", "라우트 구성", "이동 · 복귀 기준"],
              rows: [
                [
                  "List-Detail",
                  "목록을 부모 라우트, 상세·생성·수정을 자식 라우트로 배치",
                  "칸을 바꿔도 목록 조회·스크롤 유지, 집중 보기는 ?focus=1, 이탈 시 이동 막기",
                ],
                [
                  "Drill-down",
                  "상세·생성·수정을 각자 독립 라우트로 배치",
                  "상세 뒤로는 위 단계 목록 주소, 수정 완료·취소와 생성 저장은 상세로 replace",
                ],
                [
                  "Routed Modal",
                  "직접 진입 주소와 목록 위 마스킹 모달을 함께 정의",
                  "새로고침 마스킹 해제 정책 명시, 닫기는 라우터 히스토리 사용",
                ],
              ],
            },
            example: {
              after: 1,
              label: "리소스 주소 구조 예시",
              code: `/space-a/items           # 목록
/space-a/items/new       # 생성
/space-a/items/{id}      # 상세 (직접 진입 가능)
/space-a/items/{id}/edit # 수정`,
            },
          },
          {
            id: "modal-and-masking",
            title: "대화상자 내부 이동과 마스킹 초안",
            paragraphs: [
              "대화상자 안에서 허용된 다른 대상으로 이동할 때는 바깥 모달을 유지하고 내용만 교체합니다. 내부 이동은 같은 대화상자 이력 항목을 replace하고, 닫기 버튼·배경 클릭·Esc는 내부 직전 화면이 아니라 대화상자 전체를 닫습니다. 별도의 확인 창은 이 내부 이동과 구분합니다.",
              "주소 마스킹으로 연 패널에서 편집 중인 초안은 패널·페이지 표현 전환보다 오래 사는 경계인 라우터 위 초안 저장소에 둡니다. 크게 보기나 화면 폭 전환이 일어나도 제목·본문·속성이 유지되고, 저장 성공이나 버리기에서만 지웁니다. 키트 링크와 Markdown·MDX 본문 안의 앱 링크도 라우터 이동으로 연결해 전체 페이지 재로드를 막습니다.",
            ],
            diagram: {
              after: 1,
              caption:
                "목록 위 마스킹 모달과 독립 페이지가 같은 주소와 라우터 위 초안 저장소를 공유합니다.",
              code: `flowchart LR
  list["목록 화면"] -- "주소 마스킹" --> modal["목록 위 모달<br/>주소창은 대상 URL"]
  modal -- "새로고침 · 크게 보기" --> full["독립 상세 페이지"]
  draft["라우터 위 초안 저장소"] -. "전환 중 보존" .- modal
  draft -. "전환 중 보존" .- full`,
            },
          },
          {
            id: "spaces-and-menus",
            title: "공간과 메뉴의 주소",
            paragraphs: [
              "공간이 여럿인 앱은 화면 주소의 첫 마디를 공간 이름으로 두고, 어느 공간에도 속하지 않는 계정·인스턴스 설정·전역 진입 화면은 공간 접두 없이 둡니다. API 경로의 첫 마디도 같은 영역 이름으로 맞춰 화면과 서버 주소를 일관되게 유지합니다.",
            ],
            bullets: {
              after: 0,
              items: [
                "전역 화면에서 보일 메뉴는 sessionStorage에 기억한 마지막 공간으로 정하고, 저장할 수 없으면 열린 동안만 기억합니다.",
                "화면 주소를 옮기면 옛 주소에서 새 주소로 돌려보내는 리다이렉트 라우트를 둡니다.",
                "라우트에서 전달하는 화면 종류와 앱 셸이 판단하는 화면 종류가 어긋나지 않게 맞춥니다.",
              ],
            },
          },
        ],
      },
    ],
  },
];

export const FRONTEND_ENGINEERING_DOCS = FRONTEND_ENGINEERING_GROUPS.flatMap((group) =>
  group.docs.map((doc) => ({ ...doc, group: group.title })),
);

// backend 공간의 Engineering 문서. Webapp 플러그인의 backend · api · database 지침을 사람이 읽는 글로 옮긴다.
export const BACKEND_ENGINEERING_GROUPS: GuideGroup[] = [
  {
    title: "",
    docs: [BACKEND_STORY],
  },
  {
    title: "구조",
    docs: [
      {
        slug: "modules",
        title: "모듈과 계층",
        icon: "layouts",
        skills: [
          "backend-engineering/SKILL.md",
          "backend-engineering/references/layers.md",
          "webapp-project/SKILL.md",
        ],
        summary:
          "서버를 모듈형 모놀리스로 나누고 각 모듈 안의 계층과 서비스·명령·트랜잭션 경계를 정하는 기준",
        sections: [
          {
            id: "modular-monolith",
            title: "모듈형 모놀리스와 계층",
            paragraphs: [
              "서버는 필요한 경계를 가진 모듈형 모놀리스를 기본으로 둡니다. 백엔드 개발 이야기에서 정리했듯 레이어보다 기능을 1차 기준으로 나누고, 각 모듈은 단수 이름으로 두며 내부를 application, domain, infrastructure 세 계층으로 나눕니다.",
              "다른 모듈이 참조할 수 있는 공개 계약은 모듈 루트의 Facade, Spi, Event뿐입니다. 다른 모듈의 내부 패키지를 직접 참조하거나 모듈끼리 순환 호출하지 않습니다. 서비스 분리, 큐, 캐시, 추상화는 막연한 대비가 아니라 구체적인 요구와 운영 비용을 따져 도입합니다.",
            ],
            diagram: {
              after: 1,
              caption:
                "모듈 밖에서는 루트의 공개 계약만 참조하고, 모듈 안에서는 계층별 책임을 나눕니다.",
              code: `flowchart TB
  outside["다른 모듈"] --> root["모듈 루트<br/>Facade · Spi · Event"]
  subgraph mod["모듈 내부"]
    direction TB
    ctrl["Controller<br/>요청 검증 · HTTP 변환"] --> svc["Service (application)<br/>유스케이스 · 트랜잭션 조율"]
    svc --> dom["Domain<br/>업무 불변식 · 상태 전이"]
    svc --> infra["Infrastructure<br/>영속성 · 조회 구현 · 외부 연동"]
    infra -. "구현" .-> dom
  end
  root --> svc`,
            },
            table: {
              after: 1,
              columns: ["역할", "책임"],
              rows: [
                ["Controller", "요청 형식 검증과 HTTP 변환"],
                ["Service", "피처의 읽기·쓰기 유스케이스와 트랜잭션·도메인 조율"],
                ["Domain", "프레임워크에 기대지 않는 순수 업무 불변식과 상태 전이"],
                ["Infrastructure", "영속성, 조회 구현, 외부 시스템 연동"],
              ],
              monoFirstColumn: true,
            },
          },
          {
            id: "service-and-command",
            title: "피처별 서비스와 명령 경로",
            paragraphs: [
              "피처마다 하나의 Service에 읽기 메서드와 쓰기 메서드를 함께 둡니다. QueryService와 명령 서비스로 클래스를 쪼개지 않고, 읽기와 쓰기의 분리는 처리 경로로 지킵니다. 공개 메서드는 리소스별로 묶고 목록 조회, 단건 조회, 생성, 수정, 삭제, 그 밖의 상태 전환 순서로 배치합니다.",
              "명령은 저장소에서 애그리거트를 복원해 업무 메서드를 호출한 뒤 명시적으로 save합니다. 변경 감지에 기대지 않고, 화면 조회 DTO를 명령 판정의 원본으로 쓰지 않습니다. 도메인 엔티티는 Setter로 불변식을 우회하지 않으며, 신규 생성과 저장소 복원을 구분해 과거 데이터에 현재 생성 규칙을 다시 강제하지 않습니다.",
            ],
            diagram: {
              after: 1,
              caption:
                "같은 Service 안에서 읽기는 조회 포트로, 쓰기는 도메인 저장소와 업무 메서드로 갈라집니다.",
              code: `flowchart LR
  svc["피처 Service"] --> read["읽기 경로<br/>application 조회 포트 → 조회 구현 → 화면 DTO"]
  svc --> write["쓰기 경로<br/>도메인 저장소 → 업무 메서드 검증 → 명시적 save"]`,
            },
            table: {
              after: 1,
              columns: ["경로", "흐름과 원칙"],
              rows: [
                ["읽기", "같은 피처의 application 조회 포트 → infrastructure 조회 구현 → 화면 DTO"],
                ["쓰기", "도메인 저장소 복원 → 업무 메서드와 불변식 검증 → 명시적 save"],
                ["반복 처리", "반복문마다 조회·저장하지 않고 묶어 확인하고 일괄 처리"],
              ],
            },
            example: {
              after: 1,
              label: "모듈 폴더 구조 (스택 무관)",
              code: `order/
  OrderFacade          # 공개 계약 (모듈 루트)
  OrderEvent           # 공개 업무 사건
  application/
    OrderErrorCode     # 모듈 단일 오류 코드
    checkout/
      CheckoutService  # 읽기·쓰기 유스케이스
      CheckoutQuery    # 화면 조회 포트
      CheckoutRequests # HTTP 요청 묶음
      CheckoutViews    # HTTP 응답 묶음
  domain/
    Order              # 애그리거트·불변식
    OrderRepository    # 도메인 저장소 포트
  infrastructure/
    ...                # 저장소·조회 구현, 외부 연동`,
            },
          },
          {
            id: "transactions",
            title: "트랜잭션과 외부 작업 경계",
            paragraphs: [
              "읽기만 있는 서비스는 클래스 전체를 읽기 전용 트랜잭션으로 선언합니다. 읽기와 쓰기가 함께 있는 서비스에는 클래스 기본 트랜잭션을 달지 않고 공개 메서드마다 읽기는 읽기 전용, 쓰기는 쓰기 트랜잭션으로 명시해 재정의 누락 실수를 막습니다.",
              "함께 성공해야 하는 DB 변경은 같은 트랜잭션에서 처리하되, 외부 API 호출이나 파일·메시지 전송을 DB 원자성으로 착각하지 않습니다. 외부 전송을 확실히 보장해야 하면 커밋과 연결한 영속 outbox, 재시도, 멱등성을 함께 설계합니다.",
            ],
            callout: {
              after: 1,
              title: "외부 연동과 DB 트랜잭션",
              body: "핵심 DB 트랜잭션의 성공과 외부 시스템 호출의 성공은 별개입니다. 타임아웃, 실패 처리, 재시도와 멱등성을 따로 정합니다.",
            },
          },
        ],
      },
      {
        slug: "contracts",
        title: "모듈 간 계약",
        icon: "transition",
        skills: ["backend-engineering/references/contracts.md"],
        summary:
          "모듈 경계를 넘나드는 Facade, 전달 타입, Event, Spi를 설계해 단방향 의존을 지키는 기준",
        sections: [
          {
            id: "facade-and-types",
            title: "피처별 Facade와 전달 타입",
            paragraphs: [
              "모듈 루트에는 다른 모듈이 참조할 공개 계약과 공개 값 타입만 둡니다. 피처가 외부에 제공하는 계약은 하나의 Facade로 모으고, QueryFacade·CommandFacade·ViewFacade처럼 용도별로 쪼개지 않습니다. 계약은 소비자가 쓰는 업무 기능을 표현하며 내부 도메인 엔티티를 그대로 노출하지 않습니다.",
              "계약 전용 입력과 결과 타입은 Facade 안의 Param과 Result 묶음에 중첩해 소유합니다. 다만 단순 인자 하나를 억지로 Param으로 감싸지는 않습니다. 여러 계약이 함께 쓰는 업무 enum이나 값 타입은 모듈 루트에 따로 두고, HTTP 요청·응답은 application의 Requests·Views에 두어 모듈 계약과 HTTP DTO의 소유 경계를 나눕니다.",
            ],
            diagram: {
              after: 1,
              caption:
                "소비 서비스는 의미 없는 중계 포트 없이 상대 모듈 루트의 Facade를 직접 호출합니다.",
              code: `flowchart LR
  consumer["소비 모듈 Service"] --> facade["제공 모듈 루트<br/>XxxFacade · Param · Result"]
  facade -. "구현" .- impl["제공 모듈 application<br/>Facade 구현체"]
  impl --> svc["제공 모듈 Service"]`,
            },
            example: {
              after: 1,
              label: "Facade와 전달 타입 이름 예시",
              code: `ProductFacade
  Param.Create
  Param.Update
  Result.Summary
  Result.Detail`,
              caption: "전용 전달 타입은 Facade 내부의 Param·Result 묶음이 소유합니다.",
            },
          },
          {
            id: "spi-conditions",
            title: "Spi 도입 조건",
            paragraphs: [
              "Spi는 소유 모듈이 외부 모듈에 구현을 요구하는 역방향 확장 계약입니다. 편의 조회나 양방향 참조를 가리기 위해 Spi를 남발하면 구조만 복잡해지므로, 아래 세 조건을 모두 충족할 때만 도입합니다.",
              "Spi는 선언 모듈의 루트에 두고 선언 모듈 밖에서 구현합니다. 번역이 필요 없으면 소유 피처가 직접 구현하고, 형태 변환이나 여러 피처 조립이 필요할 때만 어댑터를 두어 코드 의존 방향을 단방향으로 유지합니다.",
            ],
            bullets: {
              after: 0,
              items: [
                "소유 모듈이 자기 업무 불변식을 검증하기 위해 그 정보가 필요하다.",
                "소유 모듈이 가진 데이터와 규칙만으로는 판정할 수 없다.",
                "호출자가 인자로 값을 넘겨 해결할 수 없다.",
              ],
            },
            diagram: {
              after: 1,
              caption:
                "Spi를 선언한 모듈은 구현 모듈을 알지 못하므로 코드 의존은 단방향으로 남습니다.",
              code: `flowchart LR
  impl["구현 모듈<br/>소유 피처 또는 어댑터"] -- "구현 · 의존" --> spi["선언 모듈 루트<br/>XxxSpi"]
  owner["선언 모듈 Service"] --> spi`,
            },
          },
          {
            id: "contract-boundaries",
            title: "계약 수단별 선택 기준",
            paragraphs: [
              "동기 호출 결과가 필요한 유스케이스를 Event로 우회하지 않고, Event는 이미 일어난 업무 사건을 전달할 때만 씁니다. 소비 서비스는 상대 Facade를 직접 호출하며, 단순 전달만 하는 중계 포트나 어댑터를 덧붙이지 않습니다.",
            ],
            table: {
              after: 0,
              columns: ["계약 수단", "두는 자리", "쓰는 경우", "피할 것"],
              rows: [
                [
                  "Facade",
                  "제공 모듈 루트",
                  "다른 모듈에 동기 업무 기능 제공",
                  "내부 엔티티 직접 노출, 용도별 Facade 분리",
                ],
                [
                  "Event",
                  "발행 모듈 루트",
                  "이미 일어난 업무 사건 통지",
                  "동기 결과가 필요한 흐름을 이벤트로 우회",
                ],
                [
                  "Spi",
                  "선언 모듈 루트",
                  "불변식 검증에 외부 판정이 필수일 때",
                  "단순 편의 조회, 양방향 참조 감추기",
                ],
                [
                  "Requests · Views",
                  "피처 application",
                  "HTTP 요청·응답 직렬화",
                  "모듈 계약의 Param·Result와 혼용",
                ],
              ],
              monoFirstColumn: true,
            },
          },
        ],
      },
      {
        slug: "sharing",
        title: "공유와 참조",
        icon: "route",
        skills: ["backend-engineering/references/sharing.md"],
        summary:
          "두 피처에 같은 코드가 필요할 때의 배치 판단과 피처·애그리거트 사이의 참조 방향 기준",
        sections: [
          {
            id: "extraction-order",
            title: "공통 코드 추출 판단 순서",
            paragraphs: [
              "application은 유스케이스와 피처별로, domain은 애그리거트별로 나눕니다. 두 축은 서로 독립적이므로 서비스 하나가 여러 애그리거트를 조율할 수 있고, 처음에는 계층 루트에 평평하게 두었다가 실제로 여러 단위가 생길 때 폴더를 나눕니다.",
              "두 피처에서 같은 코드가 필요해지면 바로 공용 폴더를 만들지 않고 도메인 규칙, 조율 로직, 실사용 공용, 우연한 유사성 순서로 판단합니다. 계층 내부 공용 코드는 해당 계층의 루트에 두며, application/shared나 common 같은 별도 공용 층은 만들지 않습니다.",
            ],
            diagram: {
              after: 1,
              caption:
                "모양이 비슷하다는 이유만으로 묶지 않고 소유권과 변경 이유 순서대로 판단합니다.",
              code: `flowchart TB
  q1{"도메인 규칙이 중복되는가"} -- "예" --> a1["domain으로 이동<br/>복수 애그리거트는 domain 루트 서비스"]
  q1 -- "아니오" --> q2{"조율 로직을 함께 쓰는가"}
  q2 -- "예" --> a2["소유 피처의 공유 서비스로 추출<br/>단방향 의존 · 트랜잭션 범위 명시"]
  q2 -- "아니오" --> q3{"2개 이상 피처가 실제로 쓰는 공용인가"}
  q3 -- "예" --> a3["application 루트에 배치"]
  q3 -- "아니오" --> a4["변경 이유가 다르면 각각 유지"]`,
            },
            table: {
              after: 1,
              columns: ["상황", "두는 자리"],
              rows: [
                ["도메인 규칙 중복", "해당 애그리거트 또는 domain 루트의 도메인 서비스"],
                ["유스케이스 조율 공유", "소유 피처를 정해 그 피처의 공유 서비스로 추출"],
                ["피처 밖 실사용 공용", "두 피처 이상 실제로 쓸 때만 application 루트"],
                ["모양만 비슷한 DTO·계약", "변경 이유가 다르면 공유하지 않고 각각 유지"],
              ],
            },
          },
          {
            id: "reference-boundaries",
            title: "피처와 애그리거트 참조 경계",
            paragraphs: [
              "백엔드에서는 패키지 간 상호 참조가 기술적으로 허용되기 때문에 의식적으로 경계를 지키지 않으면 금방 순환 참조가 생깁니다. 저는 피처와 애그리거트 사이에 네 가지 참조 규칙을 둡니다.",
            ],
            bullets: {
              after: 0,
              items: [
                "다른 피처의 완성된 조회는 소유 피처 서비스의 읽기 메서드로 요청하고, 인접 피처의 조회 포트를 직접 호출하지 않습니다.",
                "피처의 일반 쓰기 메서드끼리 직접 호출해 공유하지 않고, 공유할 업무 규칙이나 조율 경계를 먼저 추출합니다.",
                "필요한 DTO와 포트의 참조도 소유권 판단을 거치며 피처 간 순환 참조를 만들지 않습니다.",
                "애그리거트끼리는 객체나 내부 타입 대신 ID로 참조하고, 복수 애그리거트의 조율과 트랜잭션은 application 서비스가 소유합니다.",
              ],
            },
          },
        ],
      },
      {
        slug: "queries",
        title: "조회",
        icon: "search",
        skills: [
          "backend-engineering/references/queries.md",
          "backend-engineering/references/cross-module-read.md",
        ],
        summary: "화면 조회 포트의 소유권, DB 필터·정렬·페이징 원칙과 모듈 경계를 넘는 조회 기준",
        sections: [
          {
            id: "query-port",
            title: "조회 포트와 결과 타입",
            paragraphs: [
              "화면 조회 포트인 Query는 그 조회를 소유한 서비스와 같은 피처의 application에 1:1로 둡니다. 구현은 infrastructure에 모듈 밖으로 공개하지 않는 기술 접두 구현체로 두고, 도메인 저장소 구현과 합치지 않습니다.",
              "조회 결과가 그대로 화면에 나가면 그 피처의 Views 타입을 직접 반환해 값만 옮겨 담는 중간 Row 타입을 만들지 않습니다. 서비스에서 추가 가공이 필요할 때만 조회 포트 안에 업무 의미를 담은 불변 행 타입을 중첩하고, 화면 조회에서 도메인 엔티티를 복원하지 않습니다.",
            ],
            diagram: {
              after: 1,
              caption:
                "화면 조회는 도메인 엔티티를 거치지 않고 피처 전용 조회 포트에서 화면 DTO로 이어집니다.",
              code: `flowchart LR
  ctrl["Controller"] --> svc["피처 Service<br/>읽기 메서드"]
  svc --> port["application<br/>XxxQuery 포트"]
  port -. "구현" .- impl["infrastructure<br/>조회 구현체"]
  impl --> db["DB"]
  impl --> dto["피처 Views 또는<br/>가공용 불변 행 타입"]`,
            },
          },
          {
            id: "filtering-and-assembly",
            title: "DB 결정과 서비스 조립",
            paragraphs: [
              "필터, 정렬, 페이징, 전체 건수는 반드시 DB가 결정하고 서비스는 확정된 결과의 조립만 맡습니다. 여러 피처의 SQL을 공통 조회 저장소에 몰아넣지 않고, 다른 피처의 조회는 소유 서비스의 읽기 메서드로 받습니다.",
              "쓰기 메서드도 존재 확인이나 선택 마스터 같은 보조 조회에는 같은 피처의 조회 포트를 쓸 수 있습니다. 다만 핵심 불변식과 상태 변경 판정은 도메인 모델과 저장소를 경유하고, 다른 모듈의 명령 판정은 공개 Facade로 요청합니다.",
            ],
            bullets: {
              after: 1,
              items: [
                "부모 페이지를 DB에서 먼저 확정한 뒤 자식을 배치로 읽어 붙이는 것은 정상적인 조립입니다.",
                "전체 데이터를 끌어온 뒤 애플리케이션 코드에서 검색하거나 페이지를 자르지 않습니다.",
                "없는 결과를 어떻게 표현할지는 조회 포트 계약에 명시하고, 서비스가 부재를 업무 오류로 변환합니다.",
              ],
            },
          },
          {
            id: "cross-module-read",
            title: "모듈 간 조회 기준",
            paragraphs: [
              "명령은 항상 공개 계약으로 처리하지만, 조회는 표시값 조립과 결과 집합 결정의 요구를 나누어 판단합니다. 페이지를 정한 뒤 애플리케이션에서 검색 조건을 적용하면 페이지와 건수가 틀어지고, to-many 조인으로 부모가 중복되면 LIMIT 대상이 달라집니다.",
              "다른 모듈의 값으로 검색·정렬·건수를 결정해야 할 때만 해당 화면의 조회 구현 안에서 교차 모듈 SQL을 허용합니다. 저장 구조에 결합한다는 비용을 인정하고 조회 구현 안에만 제한하며, 다른 모듈 내부 타입 참조나 직접 테이블 변경은 허용하지 않습니다. 조회 편의를 위해 동기화 사본이나 보고 모듈, DB 뷰를 먼저 도입하지 않습니다.",
            ],
            table: {
              after: 1,
              columns: ["필요한 것", "기본 선택"],
              rows: [
                ["다른 모듈의 표시 정보", "부모 페이지 확정 후 Facade 배치 조회"],
                ["다른 모듈 값으로 검색·정렬·건수 결정", "해당 화면의 SQL 조회에서 직접 읽기 허용"],
                ["조건에 맞는 자식 존재 여부", "EXISTS"],
                ["자식 개수 기준 정렬", "부모당 한 값인 집계"],
                ["검색에 이미 필요한 to-one 조인의 표시값", "같은 쿼리에서 투영"],
                ["여러 자식 목록 표시", "확정한 부모 ID로 각각 배치 조회"],
                ["업무 당시 값 보존", "당시 시점의 스냅샷 저장"],
              ],
            },
          },
        ],
      },
    ],
  },
  {
    title: "규칙",
    docs: [
      {
        slug: "code-style",
        title: "코드 규칙",
        icon: "code",
        skills: ["backend-engineering/references/code-style.md"],
        summary: "역할이 드러나는 이름 규칙, 계층 확장 방식, 타입과 테스트의 일관된 기준",
        sections: [
          {
            id: "naming-and-roles",
            title: "역할과 이름 규칙",
            paragraphs: [
              "클래스와 파일 이름만 보고 역할을 알 수 있게 Controller, Service, Query, Repository, Requests, Views, ErrorCode 접미를 일관되게 씁니다. 저장소와 조회 구현에는 구현 기술 이름을 앞에 붙이고, QueryRepository처럼 두 역할을 섞은 이름은 쓰지 않습니다.",
              "의존성은 생성자로 주입하고 필드와 인자는 선언 타입의 lowerCamelCase를 써서 Repository나 Service 접미를 생략한 모호한 이름을 피합니다. 조회 메서드는 없을 수 있으면 find로 시작해 빈 값을 표현하는 타입을 돌려주고, 반드시 있어야 하면 get으로 시작해 없을 때 예외를 던집니다. 단순 속성 접근자는 get 접두 없이 속성 이름을 그대로 씁니다.",
            ],
            table: {
              after: 1,
              columns: ["이름 규칙", "의미와 사용 기준"],
              rows: [
                ["XxxService", "피처의 읽기·쓰기 유스케이스와 트랜잭션 조율"],
                ["XxxQuery / XxxRepository", "화면 조회 포트와 도메인 저장소 포트를 분리"],
                ["Requests · Views", "피처 application의 HTTP 요청·응답 DTO 묶음"],
                ["Param · Result", "Facade·Spi 공개 계약 내부의 전용 전달 타입 묶음"],
                ["find... / get...", "없을 수 있는 조회는 find, 필수 조회는 get(없으면 예외)"],
              ],
              monoFirstColumn: true,
            },
            example: {
              after: 1,
              label: "메서드 이름 대조",
              code: `findById(id)   # 없을 수 있음 → 빈 값 표현 타입 반환
getById(id)    # 반드시 있어야 함 → 없으면 업무 예외
order.status() # 속성 접근자 → get 접두 없이 이름만`,
            },
          },
          {
            id: "layer-growth",
            title: "계층 배치와 타입 경계",
            paragraphs: [
              "처음부터 빈 폴더를 미리 파지 않고 각 계층을 평평하게 시작합니다. 실제 단위가 늘어날 때 domain은 애그리거트별로, application은 피처·유스케이스별로, infrastructure는 기술 관심사별로 나눕니다.",
              "SQL과 영속성 도구의 타입은 infrastructure 안에 가둡니다. 엔티티는 식별자 동등성을, 값은 내용 동등성을 쓰며 검증이나 정규화가 필요한 값에 값 객체를 도입합니다. 불변 전달 타입은 언어가 제공하는 불변 레코드 타입을 기본으로 하고, 현재 시각은 직접 호출하지 않고 주입한 시계로 전달합니다.",
            ],
            diagram: {
              after: 1,
              caption: "처음에는 평평하게 두고, 실제 단위가 늘어날 때 계층별 기준에 따라 나눕니다.",
              code: `flowchart LR
  flat["평평한 계층 루트"] --> dom["domain<br/>애그리거트별 분리"]
  flat --> app["application<br/>피처·유스케이스별 분리"]
  flat --> infra["infrastructure<br/>기술 관심사별 분리"]`,
            },
          },
          {
            id: "testing-and-discipline",
            title: "예외·테스트·검사 기준",
            paragraphs: [
              "예외를 빈 catch나 포괄 catch로 삼키지 않고, 오류 처리와 로깅 책임을 여러 계층에 중복시키지 않습니다. 테스트는 내부 구현 세부가 아니라 업무 불변식, 원자성, 중복 명령, 권한처럼 외부에서 관찰할 수 있는 결과를 검증하고, 포매터·린트·경계 검사를 프로젝트 도구로 함께 돌립니다.",
            ],
            table: {
              after: 0,
              columns: ["검증 축", "확인할 결과"],
              rows: [
                ["업무 불변식", "도메인 규칙 위반이 차단되고 잘못된 상태로 전이되지 않음"],
                ["원자성과 중복", "실패 시 부분 반영이 남지 않고 중복 명령에도 안전함"],
                ["권한과 경계", "허용되지 않은 접근이 차단되고 정적·경계 검사를 통과함"],
              ],
            },
          },
        ],
      },
      {
        slug: "errors",
        title: "오류 처리",
        icon: "details",
        skills: ["backend-engineering/references/errors.md"],
        summary: "도메인 규칙 위반과 서비스 유스케이스 오류의 분리, 접근 판정 단일화 기준",
        sections: [
          {
            id: "error-responsibility",
            title: "도메인 오류와 서비스 오류",
            paragraphs: [
              "오류는 판정하는 주체에 따라 책임을 나눕니다. 도메인은 자기 업무 불변식과 상태 전이 위반만 판정하고, HTTP 상태나 프레임워크 예외, application의 ErrorCode를 참조하지 않습니다. 도메인 위반 메시지는 내부 상태나 비밀값 없이 사용자에게 전달 가능한 업무 언어로 씁니다.",
              "요청 주체, 자원 부재, 접근 권한, 동시 변경 같은 유스케이스 오류는 application 서비스가 모듈 application 루트의 단일 ErrorCode로 판정합니다. 애그리거트마다 오류 코드를 쪼개지 않으며, 공통 HTTP 예외 처리기가 일관되게 로그와 application/problem+json 응답을 만듭니다.",
            ],
            diagram: {
              after: 1,
              caption:
                "도메인과 서비스는 각자 아는 오류만 던지고, HTTP 상태와 응답 본문 변환은 경계의 공통 처리기가 맡습니다.",
              code: `flowchart LR
  dom["도메인 규칙 위반<br/>순수 예외 + 업무 메시지"] --> handler["공통 HTTP 예외 처리기"]
  svc["서비스 유스케이스 오류<br/>모듈 ErrorCode 예외"] --> handler
  handler --> resp["application/problem+json<br/>400 · 403 · 404 · 409"]`,
            },
            table: {
              after: 1,
              columns: ["주체", "판정 대상", "표현 방식"],
              rows: [
                [
                  "도메인",
                  "자기 업무 규칙과 상태 전이 위반",
                  "메시지만 담은 프레임워크 독립 규칙 위반 예외",
                ],
                ["서비스", "부재, 권한, 동시 변경 충돌", "모듈 ErrorCode를 가진 업무 예외"],
                [
                  "HTTP 경계",
                  "예외를 응답과 로그로 변환",
                  "공통 처리기에서 problem+json과 상태 코드 매핑",
                ],
              ],
            },
          },
          {
            id: "access-decision",
            title: "접근 판정 단일화",
            paragraphs: [
              "대상에 접근할 수 있는지는 모듈의 접근 권한 검사기 한 곳에서 판정합니다. 컨트롤러, 조회, 알림, 실시간 신호가 각자 조건을 다시 쓰면 한 경로만 고쳐져 화면에는 안 보이는 대상이 알림으로 새어 나갑니다.",
              "같은 권한 검사기가 대상 응답에 실리는 가능 동작 목록을 만들고, 알림과 실시간 신호를 받을 사람도 함께 거릅니다. 모든 예외를 일반 400으로 뭉개어 부재·권한·충돌 구분을 잃지 않도록 주의합니다.",
            ],
            table: {
              after: 1,
              columns: ["판정 결과", "HTTP 응답"],
              rows: [
                ["볼 수 없는 대상", "404 · 존재 여부도 알리지 않음"],
                ["볼 수는 있지만 해당 동작 권한이 모자람", "403"],
                ["닫히거나 보관된 대상을 고치려 함", "409"],
              ],
            },
          },
        ],
      },
      {
        slug: "api",
        title: "API 계약",
        icon: "file",
        skills: ["backend-engineering/references/api.md"],
        summary:
          "서버를 계약 원본으로 두고 경로, 상태 코드, 오류 형식, 권한, 목록과 업로드 계약을 맞추는 기준",
        sections: [
          {
            id: "contract-source",
            title: "서버 원본과 경로·상태 코드",
            paragraphs: [
              "HTTP 계약의 원본은 서버입니다. API를 바꾸면 OpenAPI 명세, 생성 클라이언트 타입, 실제 호출자를 같은 변경 안에서 함께 맞춥니다. 자원 경로는 복수 명사를 기본으로 하고 업무 전이는 의미 있는 하위 자원으로 표현하며, 화면 주소와 API 경로의 첫 마디를 같은 영역 이름으로 맞춥니다. 웹훅처럼 외부에 등록해 둔 주소는 옮기지 않습니다.",
              "전역 success·data 래퍼를 기본으로 덧붙이지 않고 표준 HTTP 상태 코드를 그대로 씁니다. 오류 응답은 application/problem+json으로 통일하며, 필드 오류와 낙관적 잠금 충돌을 구분하고 스택 트레이스나 비밀값은 절대 응답에 넣지 않습니다.",
            ],
            table: {
              after: 1,
              columns: ["동작", "기본 상태 코드와 응답"],
              rows: [
                ["조회", "200 · 대상 또는 목록 본문"],
                ["생성", "201 · Location 헤더와 필요 시 생성 결과"],
                ["변경 · 삭제", "204 · 즉시 필요한 결과가 있을 때만 응답 모델 명시"],
                ["규칙 위반 · 오류", "400 · 403 · 404 · 409와 application/problem+json"],
              ],
            },
          },
          {
            id: "auth-and-capabilities",
            title: "권한 판정과 화면 전달",
            paragraphs: [
              "인증된 사용자와 자원 접근 권한은 반드시 서버에서 검사합니다. REST, MCP, 파일 다운로드, 알림, 실시간 신호가 모두 같은 권한 검사기에게 물어 경로마다 정책이 어긋나지 않게 합니다.",
              "화면이 권한 규칙을 따로 복제해 계산하지 않도록, 대상 응답에 지금 사용자가 할 수 있는 일을 can 필드로 함께 내려 줍니다. 화면은 이 값에 따라 버튼을 보이거나 숨기기만 합니다.",
            ],
            example: {
              after: 1,
              label: "대상 응답의 권한 전달 구조",
              code: `{
  "id": "doc_123",
  "title": "API 계약",
  "can": {
    "view": true,
    "edit": true,
    "manage": false
  }
}`,
            },
          },
          {
            id: "data-and-uploads",
            title: "부분 수정·시각·목록·업로드 계약",
            paragraphs: [
              "경계에서 자주 어긋나는 부분 수정, 시각 표현, 목록 페이징, 파일 업로드, 동시 편집 충돌은 계약 단계에서 규칙을 분명히 못 박아 둡니다. 브라우저 캐시 무효화가 동시 편집 충돌을 해결해 주지 않으므로 버전 충돌과 재시도 멱등성을 서버에서 검토합니다.",
            ],
            table: {
              after: 0,
              columns: ["영역", "계약 기준"],
              rows: [
                ["PATCH", "필드 생략(유지), null(비움), 값 전달(변경)의 의미를 명확히 구분"],
                ["시각", "업무 날짜, 지역 시각, 절대 시각을 구별하고 절대 시각은 UTC로 전달"],
                ["목록", "서버 필터, 안정된 정렬, 페이지·커서 계약을 명시하고 count와 조건 일치"],
                [
                  "업로드",
                  "임시 파일과 자원 연결의 소유권·만료·권한을 분리하고 크기·타입·경로 검증",
                ],
                ["동시성", "버전 충돌과 명령 재시도 시 중복 효과를 검토"],
              ],
            },
          },
        ],
      },
      {
        slug: "database",
        title: "DB와 마이그레이션",
        icon: "swatch",
        skills: ["backend-engineering/references/database.md"],
        summary:
          "버전 마이그레이션으로 스키마를 바꾸고 생성 쿼리 코드와 검증·복구 절차를 지키는 기준",
        sections: [
          {
            id: "migration-workflow",
            title: "버전 마이그레이션과 쿼리 코드 생성",
            paragraphs: [
              "DB 스키마는 버전을 붙인 마이그레이션 파일로만 바꾸고, 공유 환경에 이미 적용된 마이그레이션 파일은 고치지 않고 항상 다음 버전을 추가합니다. 쿼리 코드와 관련 타입은 스키마에서 프로젝트 명령으로 생성하며 생성된 파일을 손으로 수정하지 않습니다.",
              "마이그레이션은 실제 사용하는 DB 엔진의 트랜잭션, DDL, 잠금, 외래키 동작에 맞춰 작성합니다. 다른 DB 엔진의 문법이나 잠금 가정을 그대로 옮겨 쓰지 않습니다.",
            ],
            bullets: {
              after: 1,
              items: [
                "현재 스키마, 마이그레이션 이력, 기존 데이터의 의미를 먼저 읽습니다.",
                "기존 행 채우기, 변환, 제거와 제약조건 적용 순서를 정합니다.",
                "실제 DB 엔진의 트랜잭션·DDL·잠금·외래키 동작에 맞춰 작성합니다.",
                "프로젝트 명령으로 쿼리 코드와 관련 타입을 다시 생성합니다.",
                "빈 DB와 이전 버전의 비식별 검증 사본에서 마이그레이션 결과를 확인합니다.",
              ],
            },
          },
          {
            id: "safety-and-recovery",
            title: "검증, 배포 순서, 복구 확인",
            paragraphs: [
              "운영 DB 자체를 검증용으로 변경하지 않고, 빈 DB와 이전 버전의 비식별 검증 사본에서 행 수, 관계, 핵심 값, 새 제약을 확인합니다. 운영 데이터 삭제나 되돌리기 어려운 변환은 사전에 승인된 범위를 확인합니다.",
              "스키마 변경은 애플리케이션 배포 순서와 실패 시 복구 수단을 함께 검토합니다. 특히 백업을 만들었다는 사실과 그 백업으로 실제 복구를 확인했다는 사실은 엄격히 구분합니다.",
            ],
            table: {
              after: 1,
              columns: ["검토 항목", "확인할 것"],
              rows: [
                ["데이터 이관 순서", "기존 행 채우기·변환·제거 뒤 제약조건 적용"],
                ["검증 환경", "빈 DB와 이전 버전 비식별 검증 사본에서 행 수·관계·제약 확인"],
                ["배포 순서", "스키마 변경과 애플리케이션 배포의 호환 구간 검토"],
                ["복구 준비", "백업 생성 여부와 별개로 실제 복구 절차와 가능성 확인"],
              ],
            },
          },
        ],
      },
    ],
  },
];

export const BACKEND_ENGINEERING_DOCS = BACKEND_ENGINEERING_GROUPS.flatMap((group) =>
  group.docs.map((doc) => ({ ...doc, group: group.title })),
);
