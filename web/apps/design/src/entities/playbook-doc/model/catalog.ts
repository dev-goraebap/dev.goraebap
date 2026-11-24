import type { SystemIconName } from "@goraebap/ui-react/icons";

interface PlaybookDoc {
  slug: string;
  title: string;
  icon: SystemIconName;
  summary: string;
  topics: string[];
  sections?: {
    id: string;
    title?: string;
    paragraphs: string[];
    diagram?: { after: number; code: string; caption: string };
  }[];
  next?: { label: string; to?: "/frontend/overview" };
}

export interface PlaybookGroup {
  title: string;
  docs: PlaybookDoc[];
}

export const PLAYBOOK_GROUPS: PlaybookGroup[] = [
  {
    title: "시작하기",
    docs: [
      {
        slug: "overview",
        title: "개요",
        icon: "book",
        summary:
          "프로젝트를 하나의 저장소로 꾸리게 된 이유와, 구조만큼은 직접 이해하며 가져가려는 생각을 담았습니다.",
        topics: ["이 공간에서 다루는 범위", "frontend, backend 공간과의 관계", "문서를 읽는 순서"],
        sections: [
          {
            id: "common",
            diagram: {
              after: 0,
              caption: "프론트엔드와 백엔드를 한 저장소에서 관리합니다.",
              code: `flowchart LR
  subgraph before["예전"]
    direction TB
    feRepo["프론트엔드 저장소"]
    beRepo["백엔드 저장소"]
  end
  subgraph now["지금 · 하나의 저장소"]
    direction TB
    web["프론트엔드 앱"]
    api["백엔드 앱"]
  end
  before -- "단순함을 택하며" --> now`,
            },
            paragraphs: [
              "예전에는 프로젝트를 관리할 때 백엔드와 프론트엔드 저장소를 나누어 개발하는 것이 당연하다고 생각했습니다. 하지만 시간이 지나면서 복잡함보다 단순함을 더 추구하게 되었고, 이 기준은 저장소 구성에도 그대로 반영되었습니다. 이제는 대부분의 경우 모노레포를 선택하며, 모노레포에서 배포나 관리 면에 부족한 부분은 AI를 통해 현상을 이해하고 메우면 된다고 생각하게 되었습니다.",
              "AI 에이전트가 순식간에 일상에 녹아들며 직접 코드를 치지 않는 시점이 왔습니다. 그럼에도 프로젝트의 구조만큼은 제가 이해하는 방식대로 흘러가야만 속이 편안합니다.",
            ],
          },
        ],
      },
      {
        slug: "big-picture",
        title: "전체 그림",
        icon: "layouts",
        summary: "프로젝트 구성부터 배포까지 각 단계가 어떻게 이어지는지 다룹니다.",
        topics: ["프로젝트의 시작부터 운영까지의 흐름", "단계별로 정해 두는 기준"],
      },
    ],
  },
  {
    title: "프로젝트 구성",
    docs: [
      {
        slug: "monorepo",
        title: "모노레포",
        icon: "workspace",
        summary: "여러 앱과 패키지를 한 저장소에서 관리하는 구성을 다룹니다.",
        topics: ["모노레포를 쓰는 기준", "폴더 구조", "패키지 매니저와 작업 실행"],
      },
      {
        slug: "package-boundaries",
        title: "패키지 경계",
        icon: "components",
        summary: "앱과 공용 패키지의 책임을 나누는 기준을 다룹니다.",
        topics: ["공용 패키지로 올리는 기준", "의존 방향", "패키지 공개 범위"],
      },
      {
        slug: "shared-config",
        title: "공통 설정",
        icon: "code",
        summary: "저장소 전체가 함께 쓰는 개발 도구 설정을 다룹니다.",
        topics: ["TypeScript 설정 공유", "검사 도구의 공통 기준", "환경 변수 관리"],
      },
    ],
  },
  {
    title: "형상관리",
    docs: [
      {
        slug: "branching",
        title: "브랜치 전략",
        icon: "route",
        summary: "작업을 나누고 합치는 브랜치 운영 방식을 다룹니다.",
        topics: ["기본 브랜치 운영", "작업 브랜치를 쓰는 기준", "병합 방식"],
      },
      {
        slug: "commits",
        title: "커밋 규칙",
        icon: "check",
        summary: "변경 이력을 읽기 쉽게 남기는 기준을 다룹니다.",
        topics: ["커밋 메시지 형식", "커밋을 나누는 단위", "공개 저장소에 넣지 않는 정보"],
      },
      {
        slug: "releases",
        title: "릴리스와 버전",
        icon: "file",
        summary: "변경을 묶어 내보내고 버전을 매기는 방식을 다룹니다.",
        topics: ["버전을 올리는 기준", "변경 내역 관리", "패키지와 앱의 릴리스 차이"],
      },
    ],
  },
  {
    title: "AI Agent",
    docs: [
      {
        slug: "context",
        title: "맥락 관리",
        icon: "details",
        summary: "AI 에이전트가 작업에 필요한 맥락을 잃지 않게 관리하는 방식을 다룹니다.",
        topics: [
          "항상 읽는 맥락과 필요할 때 읽는 맥락",
          "긴 작업의 이어받기",
          "저장소 밖 임시 문서",
        ],
      },
      {
        slug: "instructions",
        title: "지침 문서",
        icon: "book",
        summary: "에이전트가 따르는 프로젝트 지침을 쓰고 유지하는 방식을 다룹니다.",
        topics: ["지침 문서의 구조", "공통 지침과 프로젝트 규칙", "지침을 최신으로 유지하기"],
      },
      {
        slug: "decisions",
        title: "결정 기록",
        icon: "file",
        summary: "되돌리기 어려운 결정과 기각한 대안을 남기는 방식을 다룹니다.",
        topics: ["기록할 결정의 기준", "기록 형식", "다음 작업자에게 넘기기"],
      },
      {
        slug: "delegation",
        title: "작업 위임과 검증",
        icon: "transition",
        summary: "에이전트에게 일을 맡기고 결과를 확인하는 방식을 다룹니다.",
        topics: ["맡길 일과 직접 판단할 일", "역할별 에이전트 나누기", "결과 검증"],
      },
    ],
  },
  {
    title: "배포",
    docs: [
      {
        slug: "environments",
        title: "환경 분리",
        icon: "desktop",
        summary: "개발과 운영 환경을 나누고 설정을 관리하는 방식을 다룹니다.",
        topics: ["환경을 나누는 기준", "환경별 설정", "비밀 값 관리"],
      },
      {
        slug: "deployment",
        title: "배포 방식",
        icon: "rocket",
        summary: "빌드한 결과를 서버에 올리는 절차를 다룹니다.",
        topics: ["빌드와 배포 절차", "배포 전 확인", "자동화 범위"],
      },
      {
        slug: "rollback",
        title: "롤백",
        icon: "reset",
        summary: "배포에 문제가 생겼을 때 되돌리는 방식을 다룹니다.",
        topics: ["되돌리는 기준", "롤백 절차", "데이터 변경이 있을 때의 주의점"],
      },
    ],
  },
  {
    title: "앱 구성",
    docs: [
      {
        slug: "frontend",
        title: "프론트엔드",
        icon: "components",
        summary: "프론트엔드를 분리했다가 걷어 내고, 다시 분리하기까지의 경험을 담았습니다.",
        topics: ["기술 구성", "폴더 구조", "디자인 시스템 연결"],
        sections: [
          {
            id: "frontend",
            diagram: {
              after: 3,
              caption: "프론트엔드를 분리했다가 걷어 내고, 다시 분리하기까지의 흐름입니다.",
              code: `flowchart TB
  jsp["Spring · JSP · jQuery"] --> react["React<br/>프론트엔드 분리"]
  react --> angular["Angular 주력"]
  angular -- "마감 비용과 피로" --> htmx["htmx · HDA"]
  htmx -- "구현 비용이 낮아지며" --> split["다시 분리"]`,
            },
            paragraphs: [
              "제가 처음 만든 웹 애플리케이션은 Spring 프레임워크에 JSP 템플릿 엔진과 jQuery를 조합한 사이트였습니다. 이후 React를 접하고 나서는 기존 방식으로 돌아가기 어려울 만큼 프론트엔드를 분리하는 작업에 재미를 느꼈고, 그 뒤로는 Angular를 주력으로 프론트엔드 분리 방식을 오랫동안 고수했습니다.",
              "그러다 어느샌가 프론트엔드를 분리해 작업하는 방식에 피로감을 느끼기 시작했습니다. 프론트엔드와 백엔드 모두 나름의 이유를 가지고 공을 들여 만들었지만, 완성된 결과물에는 늘 아쉬운 구석이 남았습니다. 시각적인 감각은 어느 정도 있다고 생각해 무엇이 부족한지는 어렴풋이 느끼고 있었고, 다른 사이트들과 비교하며 그 차이를 확인했지만, 그 마감을 끝까지 챙기는 데에도 상당한 비용이 들었습니다.",
              "그래서 백엔드 프레임워크에 htmx 같은 HDA(Hypermedia-Driven Application) 방식을 얹어 적은 비용으로 SPA 같은 경험을 내는 접근에 한동안 빠졌습니다. 하지만 소스코드가 적다고 해서 관리 방식까지 우아한 것은 아니라는 사실을 깨달았습니다. 프론트엔드 프레임워크를 쓸 때 당연했던 컴포넌트의 응집도, 즉 HTML·CSS·JS 로직이 한곳에 모여 있는 코로케이션(colocation)이 늘 아쉬웠고, 이를 억지로 보완하려고 추가 설정을 붙이는 과정도 만족스럽지 않았습니다. 또 htmx가 해결하지 못하는 영역에서 JavaScript를 직접 써야 할 때면 다시 npm 진영의 라이브러리가 그리워졌고, TypeScript나 JavaScript 안에서 createElement를 호출하거나 백틱 문자열 안에 HTML을 넣는 상황이 반복되며 급격히 피로가 쌓였습니다. 프론트엔드 프레임워크가 지나치게 복잡하고 대부분의 웹 애플리케이션에는 필요하지 않을지 모른다는 글에 공감하기도 했지만, 복잡도가 과한 것과 개발 경험(DX)은 또 다른 이야기라고 생각하게 되었습니다.",
              "결국 AI 에이전트가 일상에 들어와 구현 비용이 압도적으로 낮아지면서 다시 프론트엔드를 분리하는 구조로 돌아왔습니다. 나중에 HDA 진영에 더 나은 패러다임이 나온다면 다시 시도해 볼 의향은 있지만, 이제는 개발 비용 때문에 고민하는 일이 줄어들어 앞으로 어떻게 될지는 잘 모르겠습니다.",
            ],
          },
        ],
        next: { label: "frontend 공간으로 이동", to: "/frontend/overview" },
      },
      {
        slug: "backend",
        title: "백엔드",
        icon: "code",
        summary: "백엔드 기술을 고르고 구조를 고민해 온 과정을 담았습니다.",
        topics: ["기술 구성", "모듈 구조", "API와 데이터"],
        sections: [
          {
            id: "backend",
            diagram: {
              after: 2,
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
            paragraphs: [
              "백엔드를 Spring으로 시작했지만, 별도의 프론트엔드 프레임워크를 늘 함께 도입하게 되면서 기술 스택을 통일하고 싶어졌습니다. 프론트엔드에서 JavaScript와 TypeScript를 반드시 써야 하는 만큼, 인지 비용을 줄이려면 백엔드도 Node.js 기반 프레임워크를 쓰는 편이 낫다고 생각했습니다. OOP에 꾸준한 관심이 있었기 때문에 Spring을 쓰지 않더라도 TypeScript 진영에서 DI와 IoC를 지원하는 NestJS가 거의 유일한 선택지가 되었습니다.",
              "프론트엔드 진영은 여러 구조를 거치며 FSD(Feature-Sliced Design)가 저와 잘 맞아 정착했지만, 백엔드는 여전히 구조적인 고민이 끊이지 않습니다. 지금 와서 그 이유를 돌이켜 보면 일관성과 유연성 사이에서 선을 긋기가 어렵고, 만들고자 하는 도메인을 제대로 파악해야 비로소 깔끔한 컨텍스트를 나눌 수 있기 때문이라고 생각합니다.",
              "저는 DDD가 다루는 개념과 클린 아키텍처의 일부를 좋아하지만, 이를 가장 엄격하게 구현하는 헥사고날 아키텍처는 늘 과하게 느껴졌습니다. 분명한 것은 레이어를 1차 기준으로 패키지를 나누는 것보다 기능을 1차 기준으로 나누는 편이 낫다는 점입니다. 다만 기능 단위로 패키지를 나누면 서로 참조할 수밖에 없고, 저는 그 관계를 깔끔하게 드러내고 싶었습니다.",
              "그러다 보니 자연스럽게 DDD의 핵심(core), 지원(supporting), 일반(generic) 하위 도메인 개념을 접하게 되었고, 도메인의 성격에 따라 패키지 간 참조 패턴도 어느 정도 정해진다고 보게 되었습니다. 다만 프론트엔드의 FSD와 달리 백엔드에서는 도메인 패키지 안에서 기능이나 컨텍스트 패키지끼리 서로 참조하는 것이 기술적으로 허용됩니다. 기능상 문제가 없더라도 컨텍스트가 서로 참조하는 구조는 좋지 않다고 믿기 때문에, 단방향 참조를 지키기 위한 구조 고민이 끝없이 이어집니다. 그래서 AI 시대인 지금도 코드가 마구잡이로 쌓이는 것을 참기 어렵고, 제가 의도한 구조대로 AI가 만들어 주기를 바랍니다. 이런 이유로 제 백엔드는 지금도 OOP를 지원하는 언어와 프레임워크 조합을 주로 선택하게 됩니다.",
            ],
          },
        ],
        next: { label: "backend 공간 준비 중" },
      },
    ],
  },
];

export const PLAYBOOK_DOCS = PLAYBOOK_GROUPS.flatMap((group) =>
  group.docs.map((doc) => ({ ...doc, group: group.title })),
);

export function getPlaybookDoc(slug: string) {
  return PLAYBOOK_DOCS.find((doc) => doc.slug === slug);
}
