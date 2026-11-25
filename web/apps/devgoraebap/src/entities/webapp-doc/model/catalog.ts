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
