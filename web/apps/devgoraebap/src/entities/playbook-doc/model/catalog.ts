import type { SystemIconName } from "@goraebap/ui-react/icons";

interface PlaybookSection {
  id: string;
  title?: string;
  paragraphs: string[];
  diagram?: { after: number; code: string; caption: string };
  table?: { after: number; columns: string[]; rows: string[][] };
}

interface PlaybookDoc {
  slug: string;
  title: string;
  icon: SystemIconName;
  summary: string;
  sections: PlaybookSection[];
  next?: { label: string; to?: "/frontend/overview" };
}

export interface PlaybookGroup {
  title: string;
  docs: PlaybookDoc[];
}

export const PLAYBOOK_GROUPS: PlaybookGroup[] = [
  {
    title: "프로젝트",
    docs: [
      {
        slug: "repository",
        title: "레포지토리 구성",
        icon: "workspace",
        summary:
          "제품 하나를 저장소 하나로 꾸리고, 프론트엔드 앱이 늘어날 때 안쪽을 나누는 제 기준을 정리합니다.",
        sections: [
          {
            id: "story",
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
          {
            id: "one-repo",
            title: "제품 하나에 저장소 하나",
            paragraphs: [
              "프론트엔드만 다루는 프로젝트라면 저장소에 바로 프론트엔드를 구성하고, 백엔드만 다루는 프로젝트라면 백엔드만 두면 됩니다. 저는 제품 하나당 저장소 하나를 기준으로 삼고 있어서, 프론트엔드와 백엔드가 함께 있는 프로젝트에서는 저장소 안을 client와 server 또는 web과 server처럼 폴더로 나눕니다.",
            ],
            diagram: {
              after: 0,
              caption: "제품 저장소 안에서 프론트엔드와 백엔드를 폴더로 나눕니다.",
              code: `flowchart TB
  repo["제품 저장소"] --> web["web · 프론트엔드"]
  repo --> server["server · 백엔드"]`,
            },
          },
          {
            id: "multiple-frontends",
            title: "프론트엔드가 둘 이상일 때",
            paragraphs: [
              "관리자 페이지를 따로 떼어 배포해야 하는 경우처럼 프론트엔드 앱이 둘 이상이면 web 안을 apps와 packages로 나누는 구성을 씁니다. 패키지 매니저의 워크스페이스 기능을 쓰는 모노레포에서 흔히 쓰는 apps/packages 구조입니다.",
              "각각 배포하는 앱은 apps에 두고, 여러 앱이 함께 쓰는 UI와 공통 설정은 packages에 모읍니다. 이때도 백엔드는 단일 서버를 그대로 유지해도 문제가 없습니다. 이 사이트가 들어 있는 저장소 역시 web/apps와 web/packages로 나뉘어 있습니다.",
            ],
            diagram: {
              after: 0,
              caption:
                "프론트엔드 앱이 둘 이상이면 web 안을 apps와 packages로 나눕니다. 백엔드는 하나로 둡니다.",
              code: `flowchart TB
  repo["제품 저장소"] --> web["web"]
  repo --> server["server · 단일 백엔드"]
  web --> apps["apps"]
  web --> packages["packages"]
  apps --> site["site · 사용자 화면"]
  apps --> admin["admin · 관리자 화면"]
  packages --> ui["ui · 공용 컴포넌트"]
  site -.-> ui
  admin -.-> ui`,
            },
          },
          {
            id: "manage-together",
            title: "나누기보다 한곳에서",
            paragraphs: [
              "혼자 프로젝트를 관리할 때는 프로젝트를 어떻게 분리할지보다 어떻게 한 프로젝트 안에서 관리할지를 먼저 묻습니다.",
            ],
          },
        ],
      },
      {
        slug: "frontend",
        title: "프론트엔드 개발",
        icon: "components",
        summary: "프론트엔드를 분리했다가 걷어 내고, 다시 분리하기까지의 경험을 담았습니다.",
        next: { label: "frontend 공간으로 이동", to: "/frontend/overview" },
        sections: [
          {
            id: "story",
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
      },
      {
        slug: "backend",
        title: "백엔드 개발",
        icon: "code",
        summary: "백엔드 기술을 고르고 구조를 고민해 온 과정을 담았습니다.",
        next: { label: "backend 공간 준비 중" },
        sections: [
          {
            id: "story",
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
      },
      {
        slug: "source-control",
        title: "형상관리",
        icon: "route",
        summary:
          "브랜치 이름과 병합 흐름, 커밋 단위, 릴리스 패치노트를 남기는 제 기준을 정리합니다.",
        sections: [
          {
            id: "branching",
            title: "브랜치 전략",
            paragraphs: [
              "브랜치는 GitHub Flow를 따라 기본 브랜치인 main 최신에서 작업 브랜치를 따고, 한 브랜치에는 한 가지 일만 담습니다. 개인이나 단독 작업에서는 PR을 강제하지 않고 기본 브랜치에 직접 커밋하거나 로컬에서 바로 합치지만, 팀이나 협업 저장소에서는 PR을 거쳐 합칩니다.",
              "브랜치 이름은 Conventional Branch 형식을 따라 <목적>/<짧은 설명>으로 짓습니다. 설명은 영어 소문자, 숫자, 하이픈으로 두세 단어에서 다섯 단어 안팎으로 쓰고, 이슈 키가 있으면 설명 앞에 붙입니다. 에이전트나 도구, 사람 이름은 접두사로 쓰지 않습니다.",
            ],
            table: {
              after: 0,
              columns: ["접두사", "쓰는 경우"],
              rows: [
                ["feature", "새 기능, 제품 동작 변경"],
                ["fix", "버그 수정"],
                ["refactor", "동작을 유지하는 구조 변경"],
                ["docs", "문서와 지침만 바꿀 때"],
                ["chore", "빌드, 도구, 의존성, 설정"],
                ["hotfix", "배포본의 긴급 수정, 배포 브랜치를 쓸 때만"],
                ["release", "배포 준비, 프로젝트가 쓸 때만"],
              ],
            },
          },
          {
            id: "commits",
            title: "커밋 규칙",
            paragraphs: [
              "커밋은 하나의 논리적 변경 단위로 나누고, 무관한 포맷 변경이나 별개의 리팩터링을 한 커밋에 섞지 않습니다. 반면 스키마, API 계약, 생성 산출물처럼 원본과 함께 맞아야 하는 파일은 같은 커밋에 담습니다.",
              "커밋 메시지는 프로젝트에 정해진 형식이 있으면 그 형식을 우선 따릅니다. 이 저장소에서는 Conventional Commits 형식에 맞춰 유형과 범위를 적고 한국어 제목을 붙이며, 판단 배경이 필요할 때만 본문에 이유를 남깁니다. AI 에이전트와 함께 만든 커밋은 Co-Authored-By 트레일러로 표시합니다.",
              "커밋과 푸시는 허용된 범위에서만 진행하고, 공개 저장소에는 서버 주소나 접속 정보 같은 비밀값을 넣지 않고 Git에서 제외한 파일에 둡니다.",
            ],
          },
          {
            id: "releases",
            title: "릴리스와 버전",
            paragraphs: [
              "버전을 올릴 때는 패치노트 맨 앞에 해당 버전 항목을 추가하고, 절 제목은 Added, Changed, Removed, Fixed 네 가지만 씁니다. 내부 구현 정리보다 사용자에게 보이는 변경만 적고, README에는 버전 번호를 적지 않습니다.",
              "한 번 게시한 버전은 덮어쓰지 않고 수정이 필요하면 새 수정 버전을 발급합니다. 게시 전에는 모의 실행으로 배포 패키지에 포함되는 파일 목록을 먼저 확인합니다.",
            ],
          },
        ],
      },
      {
        slug: "deployment",
        title: "배포",
        icon: "rocket",
        summary:
          "임시 작업 폴더에서 빌드해 서버에 올리고, 문제가 생기면 링크 전환으로 되돌리는 제 배포 방식을 정리합니다.",
        sections: [
          {
            id: "deploy",
            title: "배포 방식",
            paragraphs: [
              "배포는 저장소 루트에서 스크립트 하나로 실행합니다. 기본 대상은 main이며, 필요하면 다른 브랜치나 커밋을 지정해 배포할 수 있습니다. 지금 작업 중인 폴더를 건드리지 않기 위해 지정한 커밋을 임시 작업 폴더인 git worktree에 꺼내 빌드합니다.",
              "빌드 결과는 서버의 releases/<시각-커밋> 폴더에 풀고 current 링크만 새 폴더로 바꿉니다. 이전 배포는 최근 5개만 남기고 나머지는 정리하며, 배포에 필요한 접속 정보는 Git에서 제외한 .env 파일에 둡니다.",
            ],
            diagram: {
              after: 0,
              caption: "빌드한 결과를 새 폴더에 올리고 링크만 바꿔 배포합니다.",
              code: `flowchart LR
  ref["브랜치나 커밋"] --> build["임시 작업 폴더에서 빌드"]
  build --> upload["releases/시각-커밋에 올리기"]
  upload --> switch["current 링크 전환"]
  switch --> prune["최근 5개만 남기기"]`,
            },
          },
          {
            id: "rollback",
            title: "롤백",
            paragraphs: [
              "문제가 생기면 롤백 옵션으로 current 링크를 바로 전 배포 폴더로 되돌립니다. 소스를 다시 빌드하지 않고 링크만 바꾸므로 빠르게 복구할 수 있습니다.",
            ],
            diagram: {
              after: 0,
              caption: "링크를 바로 전 배포로 되돌립니다.",
              code: `flowchart LR
  current["current"] -. "지금" .-> latest["releases/새 배포"]
  current == "롤백" ==> previous["releases/바로 전 배포"]`,
            },
          },
        ],
      },
    ],
  },
  {
    title: "작업 관리",
    docs: [
      {
        slug: "requirements",
        title: "요구사항 관리",
        icon: "file",
        summary:
          "이슈 트래킹 도구와 저장소 중 한곳에만 요구사항과 결정을 기록해 기준이 갈라지지 않게 관리합니다.",
        sections: [
          {
            id: "one-place",
            title: "기록은 한곳에만",
            paragraphs: [
              "요구사항과 결정은 반드시 한곳에만 기록합니다. 같은 내용을 두 곳에서 따로 관리하면 시간이 지나며 내용이 어긋나고 어느 쪽이 맞는지 알 수 없게 됩니다.",
            ],
            diagram: {
              after: 0,
              caption:
                "이슈 트래킹 도구가 있으면 그곳에, 없으면 저장소에 기록합니다. 두 곳에 나눠 적지 않습니다.",
              code: `flowchart TB
  start{"이슈 트래킹 도구가 있는가"}
  start -- "있음" --> tracker["이슈 트래킹에만 기록<br/>에이전트는 MCP로 읽고 씀"]
  start -- "없음" --> repo["같은 저장소의 Markdown과 Git<br/>요구사항 · 설계 · 결정 기록"]`,
            },
          },
          {
            id: "with-tracker",
            title: "이슈 트래킹 도구가 있을 때",
            paragraphs: [
              "이슈 트래킹 도구가 있는 프로젝트라면 그곳을 원본으로 쓰고 저장소에 같은 내용을 복제하지 않습니다. AI 에이전트는 이슈 트래킹 도구의 MCP를 통해 이슈를 직접 읽고 씁니다. 브랜치 이름에 이슈 키를 넣어 코드 변경과 이슈를 연결합니다.",
            ],
          },
          {
            id: "in-repository",
            title: "저장소에서 관리할 때",
            paragraphs: [
              "이슈 트래킹 도구가 없다면 같은 저장소에 Markdown으로 요구사항, 설계, 결정 기록을 두고 코드와 같은 커밋에 담습니다. 요구사항에는 제품이 지켜야 할 동작과 수용 조건을, 설계에는 기술 구조를, 결정 기록에는 맥락과 선택, 검토했다 버린 대안과 이유를 적습니다.",
              "문서마다 고유 ID를 두면 파일 위치가 바뀌어도 이력을 따라갈 수 있습니다. 대화 중 시행착오마다 문서를 고치지 않고 작업을 마친 시점에 정리된 문서와 코드를 한 커밋으로 남기며, 과거 이력을 거슬러 문서화하기보다 새로 바꾸는 기능부터 시작합니다.",
            ],
          },
        ],
      },
      {
        slug: "ai-context",
        title: "AI 맥락",
        icon: "details",
        summary:
          "에이전트 지침, 결정 기록, 저장소 밖 임시 문서를 역할에 따라 나누어 작업 맥락을 이어 갑니다.",
        sections: [
          {
            id: "instructions",
            title: "지침 문서",
            paragraphs: [
              "에이전트 지침의 원본은 AGENTS.md 파일 하나로 두고, Claude Code용 CLAUDE.md는 @AGENTS.md 한 줄로 같은 파일을 가리킵니다. 지침 파일에는 매번 알아야 할 핵심 규칙만 남기고, 자세한 기준은 참고 문서로 나누어 필요할 때 읽게 합니다.",
            ],
            diagram: {
              after: 0,
              caption: "항상 읽는 지침에서 필요한 문서로 이어지게 둡니다.",
              code: `flowchart LR
  agents["AGENTS.md<br/>항상 읽는 지침"] --> refs["참고 문서<br/>필요할 때 읽음"]
  agents --> decisions["결정 기록<br/>저장소 안"]
  agents --> handoff["이어받기 · 임시 문서<br/>저장소 밖"]`,
            },
          },
          {
            id: "decisions",
            title: "결정 기록",
            paragraphs: [
              "되돌리기 어려운 결정과 검토했다 기각한 대안은 저장소의 결정 기록인 docs/decisions.md에 남깁니다. 세션이 끝나면 대화 속 결정은 사라지고, 다음 작업자가 배경을 모르면 같은 논의를 반복하거나 기존 결정을 되돌릴 수 있기 때문입니다.",
            ],
          },
          {
            id: "outside-repository",
            title: "저장소 밖에 두는 문서",
            paragraphs: [
              "Git으로 관리하지 않는 임시 문서는 저장소 밖 ~/tmp/<프로젝트>/ 폴더에 둡니다. 작업을 다른 세션으로 넘겨야 할 때도 이어받기 문서를 저장소 밖에 남깁니다.",
              "이어받기 문서에는 원한 결과, 결정과 기각한 안, 바꾼 파일, 다음 단계, 검증 상태, 남은 질문을 적고 비밀값은 넣지 않습니다.",
            ],
          },
        ],
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
