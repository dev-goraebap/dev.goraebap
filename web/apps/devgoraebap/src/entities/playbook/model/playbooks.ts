import type { SystemIconName } from "@goraebap/ui-react/icons";
import type { DocSection } from "@/entities/webapp-doc";
import type { SkillId } from "./skills";

export interface PlaybookStep {
  title: string;
  detail: string;
  skills: SkillId[];
}

export interface Playbook {
  slug: string;
  title: string;
  icon: SystemIconName;
  // 작업이 실제로 진행되는 단계. 상시는 어느 단계에서나 끼어든다.
  phase: "기획" | "개발" | "출시" | "상시";
  summary: string;
  steps: PlaybookStep[];
  sections: DocSection[];
  // 같은 절차를 에이전트용으로 적은 goraebap-mode 플레이북(plugins/webapp/skills 기준 경로)
  skill: string;
}

export const PHASE_TONES: Record<Playbook["phase"], string> = {
  기획: "oklch(0.66 0.13 70)",
  개발: "oklch(0.62 0.13 250)",
  출시: "oklch(0.64 0.13 160)",
  상시: "oklch(0.6 0.14 310)",
};

const PLAYBOOK = "goraebap-mode/playbooks/";

// 작업이 진행되는 순서대로 둔다. 상시 플레이북은 맨 뒤에 모은다.
export const PLAYBOOKS: Playbook[] = [
  {
    slug: "requirements",
    title: "요구사항 토론",
    icon: "search",
    phase: "기획",
    summary: "문제 정의와 근거 조사, 선택지 결정을 거쳐 요구사항 문서로 남기는 기획 절차",
    skill: `${PLAYBOOK}requirements.md`,
    steps: [
      {
        title: "문제와 사용자 정리",
        detail: "누가 어떤 상황에서 무엇을 하려는지 문답으로 정리",
        skills: ["goraebap-mode"],
      },
      {
        title: "근거 조사",
        detail: "코드·문서·비슷한 제품에서 먼저 확인할 수 있는 사실 수집",
        skills: ["goraebap-mode"],
      },
      {
        title: "선택지와 결정",
        detail: "갈리는 지점만 권장안과 대가를 붙여 하나씩 결정",
        skills: ["goraebap-mode", "webapp-project"],
      },
      {
        title: "요구사항 문서로 남기기",
        detail: "정한 내용과 기각한 대안을 문서와 결정 기록에 정리",
        skills: ["issue-tool", "writer-role"],
      },
    ],
    sections: [
      {
        id: "problem-and-evidence",
        title: "질문 전에 근거부터 확인합니다",
        paragraphs: [
          "기능을 바로 만들기 전에 누가 어떤 상황에서 무엇을 하려는지부터 문답으로 좁힙니다. 머릿속 아이디어를 곧장 코드로 옮기면 구현 중간에 범위가 흔들리기 때문에, 질문을 주고받으며 모호한 전제를 먼저 드러냅니다.",
          "문제 윤곽이 잡히면 코드와 기존 문서, 비슷한 제품에서 확인할 수 있는 사실은 먼저 찾아봅니다. 현재 구현과 문서상의 의도, 아직 확인하지 못한 추정을 나누어 두어야 불필요한 질문을 줄이고 근거 위에서 다음 결정을 내릴 수 있습니다. 조사만 필요한 단계라면 여기서 멈추고 구현으로 넘어가지 않습니다.",
        ],
      },
      {
        id: "decisions-one-by-one",
        title: "갈리는 지점만 권장안과 함께 하나씩 정합니다",
        paragraphs: [
          "관례나 코드로 답이 나오는 부분은 확인하고 넘어가고, 제품 의미나 구조 선택이 갈리는 지점만 사용자에게 묻습니다. 이때 여러 결정을 한꺼번에 던지지 않고 하나씩 꺼내며, 권장안과 그 선택이 감수하는 대가를 함께 붙여 빠르게 판단할 수 있게 합니다.",
          "여러 영역에 걸치는 구조나 상태 소유권, 외부 연동처럼 되돌리기 어려운 선택은 아키텍처 기준에 비추어 검토한 뒤 결정을 확정합니다.",
        ],
      },
      {
        id: "leave-records",
        title: "정한 것과 기각한 안을 문서로 남깁니다",
        paragraphs: [
          "합의가 끝나면 결정한 범위와 수용 조건을 문서로 남기고, 되돌리기 어려운 선택과 기각한 대안은 결정 기록에 함께 적습니다. 업무 추적은 프로젝트가 정한 이슈 도구에 연결해 구현 단계로 바로 이어지게 합니다.",
          "사람이 읽을 요구사항 문서는 결정 내용과 근거를 정리해 글쓰기 역할에 맡겨 다듬습니다. 문서가 정리되면 프로젝트 구성이나 기능 구현으로 넘어갑니다.",
        ],
      },
    ],
  },
  {
    slug: "project-setup",
    title: "프로젝트 만들기",
    icon: "workspace",
    phase: "기획",
    summary: "제품 하나를 저장소 하나로 꾸리고 지침·어댑터·배포 경로를 세우는 초기 구성 절차",
    skill: `${PLAYBOOK}project-setup.md`,
    steps: [
      {
        title: "저장소와 폴더 구성",
        detail: "모노레포 여부와 앱·패키지 자리 확정",
        skills: ["webapp-project"],
      },
      {
        title: "지침 연결",
        detail: "AGENTS.md에 Webapp 블록과 프로젝트 규칙 표 배치",
        skills: ["onboarding"],
      },
      {
        title: "어댑터 고르기",
        detail: "스택이 같은 어댑터를 골라 구현 견본으로 연결",
        skills: ["onboarding", "frontend-engineering", "backend-engineering"],
      },
      {
        title: "브랜치와 배포 경로",
        detail: "형상관리 방식과 첫 배포 경로 사전 확정",
        skills: ["webapp-project", "deploy-procedure"],
      },
    ],
    sections: [
      {
        id: "repo-layout",
        title: "제품 하나에 저장소 하나",
        paragraphs: [
          "저는 제품 하나당 저장소 하나를 기준으로 삼습니다. 프론트엔드만 다루는 프로젝트라면 저장소에 바로 프론트엔드를 두고, 백엔드만 다루면 백엔드만 둡니다. 프론트엔드와 백엔드가 함께 있는 프로젝트에서는 저장소 안을 web과 server처럼 폴더로 나누어 한곳에서 관리합니다.",
          "관리자 페이지를 따로 떼어 배포해야 하는 경우처럼 프론트엔드 앱이 둘 이상이면 web 안을 apps와 packages로 나눕니다. 각각 배포하는 앱은 apps에 두고, 여러 앱이 함께 쓰는 UI와 공통 설정은 packages에 모읍니다. 이때도 백엔드는 단일 서버를 그대로 유지합니다.",
          "프론트엔드, 백엔드, 요구사항과 결정 기록이 한 저장소에 모여 있으면 코드 변경과 문서, API 계약을 한 번에 대조할 수 있고 AI 에이전트도 저장소 경계를 넘나들지 않고 전체 맥락을 읽습니다. 배포 권한이나 보안 경계가 완전히 다르거나 독립된 팀이 서로 다른 주기로 운영하는 단계가 되었을 때 비로소 저장소를 나눕니다.",
        ],
        diagram: {
          after: 1,
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
        id: "connect-guidelines",
        title: "지침 연결과 어댑터 고르기",
        paragraphs: [
          "저장소 자리를 잡으면 지침 사본을 프로젝트 안에 복사하지 않고, 루트의 AGENTS.md에 Webapp 플러그인 관리 블록과 프로젝트 규칙 표를 둡니다. 공통 지침은 플러그인 원본이 맡고, 이 프로젝트만 다르게 하는 결정만 프로젝트 규칙 표에 예외로 적습니다.",
          "핵심 지침은 스택 없이 판단 기준만 담으므로, 스택이 같은 어댑터를 골라 AGENTS.md의 어댑터 줄에 연결합니다. 프론트엔드와 백엔드 영역 지침을 읽을 때 어댑터의 구현 견본을 함께 보게 되어, 초기 폴더 구조와 코드 규칙이 어긋나지 않습니다. 맞는 어댑터가 없으면 지침만으로 시작하고 그 사실을 남깁니다.",
        ],
      },
      {
        id: "git-and-first-deploy",
        title: "브랜치와 첫 배포 경로를 미리 정합니다",
        paragraphs: [
          "기능을 쌓기 전에 기본 브랜치와 작업 브랜치 이름 규칙, 커밋 단위를 정해 둡니다. 혼자 관리하는 저장소인지 협업 저장소인지에 따라 PR을 거칠지 바로 합칠지도 이 단계에서 맞춰 둡니다.",
          "배포 역시 나중으로 미루지 않고 프로젝트의 배포 절차와 서버 경로, 접속 정보를 담을 환경 파일 자리까지 먼저 잡습니다. 첫 화면을 바로 올려 볼 수 있는 상태가 되면 기능 구현으로 넘어갑니다.",
        ],
      },
    ],
  },
  {
    slug: "feature",
    title: "기능 구현",
    icon: "code",
    phase: "개발",
    summary: "이슈 확인부터 의존 순서 구현, 브라우저 확인, 커밋과 기록까지 잇는 개발 절차",
    skill: `${PLAYBOOK}feature.md`,
    steps: [
      {
        title: "이슈 잡기",
        detail: "할 일과 수용 조건을 이슈에 적고 진행 중으로 이동",
        skills: ["issue-tool"],
      },
      {
        title: "영역 지침 읽기",
        detail: "바뀌는 영역의 지침과 어댑터 함께 확인",
        skills: ["goraebap-mode", "frontend-engineering", "backend-engineering"],
      },
      {
        title: "의존 순서대로 구현",
        detail: "스키마·서버 계약·생성 타입·화면 순으로 분할 구현",
        skills: ["backend-engineering", "frontend-engineering", "frontend-design-system"],
      },
      {
        title: "화면에서 확인",
        detail: "바뀐 사용자 동작을 브라우저에서 직접 눌러 검증",
        skills: ["browser"],
      },
      {
        title: "커밋과 기록",
        detail: "변경 커밋 후 이슈에 한 일과 남은 일 기록",
        skills: ["webapp-project", "issue-tool"],
      },
    ],
    sections: [
      {
        id: "scope-and-guidelines",
        title: "이슈와 영역 지침부터 맞춥니다",
        paragraphs: [
          "구현에 들어가기 전에 프로젝트가 정한 이슈 도구에 할 일과 수용 조건을 적고 진행 중으로 옮깁니다. 누가 어떤 상황에서 무엇을 할 수 있어야 하는지가 분명해야 구현 도중 범위가 새지 않습니다.",
          "그다음 바뀌는 영역의 지침과 프로젝트가 연결한 어댑터를 함께 읽습니다. 상태 소유자, API 입출력, 권한, 실패·충돌 상태를 먼저 정하고, 가볍지 않은 기능이나 UI 컴포넌트는 직접 만들기 전에 검증된 오픈소스를 먼저 검토합니다.",
        ],
      },
      {
        id: "dependency-order",
        title: "의존 순서대로 나눠 만들고 브라우저에서 확인합니다",
        paragraphs: [
          "구현은 스키마, 서버 계약, 생성 타입, 화면 순서로 의존 방향에 맞춰 진행합니다. 서버와 화면이 한 번에 얽히지 않도록 동작을 확인할 수 있는 작은 단위로 나누어 쌓습니다.",
          "코드를 다 썼다고 끝내지 않고, 바뀐 사용자 동작을 브라우저에서 직접 열어 눌러 봅니다. 타입 검사와 빌드 같은 자동 검사 통과와 실제 화면 동작 확인은 별개이며, 이 과정에서 시각적 어색함이나 상호작용 마감이 걸리면 바로 화면 다듬기 라운드로 넘어갑니다.",
        ],
      },
      {
        id: "commit-and-record",
        title: "확인이 끝나면 커밋하고 이슈에 남깁니다",
        paragraphs: [
          "동작과 코드 검토가 끝나면 스키마, API 계약, 생성 산출물, 테스트, 관련 문서를 하나의 논리적 단위로 묶어 커밋합니다. 에이전트가 임의로 커밋하지 않고 제가 결과를 확인한 뒤 커밋을 요청합니다.",
          "마지막으로 이슈 도구에 실제 수행한 검증과 한 일, 남은 일을 남깁니다. 확인하지 못한 범위가 있으면 완료로 덮지 않고 그대로 적어 다음 작업으로 이어 갑니다.",
        ],
      },
    ],
  },
  {
    slug: "ui-polish",
    title: "화면 다듬기",
    icon: "palette",
    phase: "개발",
    summary: "기능 구현 뒤 브라우저에서 화면을 직접 열어 표현과 상호작용을 다듬는 마감 절차",
    skill: `${PLAYBOOK}ui-polish.md`,
    steps: [
      {
        title: "화면 보기",
        detail: "데스크톱·휴대폰 폭과 라이트·다크 모드에서 화면 확인",
        skills: ["browser"],
      },
      {
        title: "기준과 대조",
        detail: "디자인 시스템과 인터랙션 기준에 어긋난 지점 점검",
        skills: ["frontend-design-system", "frontend-interaction"],
      },
      {
        title: "결정이 갈리는 곳 묻기",
        detail: "취향이 갈리는 부분만 시안이나 권장안으로 질문",
        skills: ["goraebap-mode"],
      },
      {
        title: "고치고 다시 보기",
        detail: "같은 화면을 다시 열어 넘침·흔들림·포커스 확인",
        skills: ["browser", "frontend-interaction"],
      },
    ],
    sections: [
      {
        id: "second-round",
        title: "기능 구현 뒤 가장 자주 도는 두 번째 라운드",
        paragraphs: [
          "기능을 한 번 구현해 두고 끝내는 경우는 거의 없습니다. 제가 작업할 때 가장 자주 반복하는 흐름은 동작이 되는 화면을 브라우저에서 직접 열어 보고, 여백·위계·반응형·전환 같은 마감을 다듬는 두 번째 라운드입니다.",
          "먼저 데스크톱과 휴대폰 폭, 라이트와 다크 모드에서 화면을 열어 봅니다. 코드만 읽어서는 보이지 않는 줄바꿈 깨짐, 요소 겹침, 어색한 간격이 실제 뷰포트에서 바로 드러납니다.",
        ],
      },
      {
        id: "check-against-standards",
        title: "감각에만 기대지 않고 기준과 대조합니다",
        paragraphs: [
          "화면을 보며 어색한 지점을 찾으면 디자인 시스템과 인터랙션 기준에 대조합니다. 토큰과 면 위계가 맞는지, 로딩·빈 결과·오류 상태가 빠지지 않았는지, 누르는 대상과 키보드 포커스 이동이 자연스러운지를 차례로 점검합니다.",
          "기준이 분명한 어긋남은 바로 고치고, 배치나 밀도처럼 취향이나 제품 판단이 갈리는 지점만 시안이나 권장안과 대가를 붙여 하나씩 묻습니다.",
        ],
      },
      {
        id: "reverify",
        title: "고친 뒤 같은 화면을 다시 열어 확인합니다",
        paragraphs: [
          "수정이 끝나면 같은 화면을 같은 조건에서 다시 열어 가로 넘침, 레이아웃 흔들림, 재방문 시 불필요한 로딩 표시, 키보드 포커스 복원을 확인합니다.",
          "화면 다듬기는 한 번에 끝내기보다 보고 고치는 짧은 주기를 몇 번 돌리며 마감 수준을 맞춥니다. 변경이 커지면 별도 커밋으로 묶어 기능 구현 커밋과 섞이지 않게 둡니다.",
        ],
      },
    ],
  },
  {
    slug: "bug-fix",
    title: "버그 수정",
    icon: "eye",
    phase: "개발",
    summary: "실패 재현부터 경계 추적, 회귀 검증, 이슈 기록까지 원인을 고치는 수정 절차",
    skill: `${PLAYBOOK}bug-fix.md`,
    steps: [
      {
        title: "재현",
        detail: "기대·실제 동작과 재현 입력·환경 확보",
        skills: ["browser", "issue-tool"],
      },
      {
        title: "원인 추적",
        detail: "증상이 처음 생긴 경계를 따라 실패한 가정 확인",
        skills: ["goraebap-mode"],
      },
      {
        title: "회귀 검증",
        detail: "수정 전 실패하고 수정 후 통과하는 검증 작성",
        skills: ["goraebap-mode"],
      },
      {
        title: "다시 확인과 기록",
        detail: "같은 입력으로 재확인하고 원인과 수정 내용 이슈 기록",
        skills: ["browser", "issue-tool"],
      },
    ],
    sections: [
      {
        id: "reproduce-first",
        title: "고치기 전에 먼저 실패를 재현합니다",
        paragraphs: [
          "버그를 만나면 코드를 바로 고치기보다 기대 동작과 실제 동작, 재현 입력과 환경을 먼저 확보합니다. 브라우저에서 재현할 수 있는 화면 버그라면 같은 입력으로 실패를 직접 눈으로 확인하고, 프로젝트의 이슈 도구에 같은 문제를 다룬 기존 기록이 있는지도 살핍니다.",
          "재현 조건을 잡지 못한 채 추측으로 고치면 겉증상만 가리고 다른 경로를 깨뜨리기 쉽습니다. 끝내 재현하지 못했다면 그 한계를 숨기지 않고 그대로 남깁니다.",
        ],
      },
      {
        id: "trace-and-guard",
        title: "증상이 처음 생긴 경계와 회귀 검증",
        paragraphs: [
          "재현이 되면 증상이 보인 화면이나 응답에서 거꾸로 경계를 따라가며 어느 지점의 가정이 틀렸는지 찾습니다. 겉으로 드러난 곳만 임시로 막지 않고 원인이 생긴 계층을 고칩니다.",
          "회귀 위험이 있는 로직에는 수정 전에 실패하고 수정 뒤에 통과하는 검증을 둡니다. 구현 문장을 그대로 비교하는 테스트 대신, 깨졌던 사용자 동작이나 계약이 유지되는지를 검증합니다.",
        ],
      },
      {
        id: "recheck-and-log",
        title: "같은 입력으로 다시 보고 이슈에 남깁니다",
        paragraphs: [
          "수정이 끝나면 처음 실패했던 입력과 환경으로 다시 확인하고, 영향을 받는 주변 호출자·권한·실패 경로까지 함께 점검합니다.",
          "확인이 끝나면 커밋을 요청하고, 이슈 도구에 원인이 무엇이었고 어디를 어떻게 고쳤는지 짧게 남깁니다.",
        ],
      },
    ],
  },
  {
    slug: "refactor",
    title: "리팩터링",
    icon: "transition",
    phase: "개발",
    summary: "계약과 동작을 고정한 채 불필요한 코드를 먼저 빼고 목표 구조로 안전하게 옮기는 절차",
    skill: `${PLAYBOOK}refactor.md`,
    steps: [
      {
        title: "동작 고정",
        detail: "구조를 옮기기 전에 지금 동작을 검증으로 고정",
        skills: ["goraebap-mode", "frontend-engineering", "backend-engineering"],
      },
      {
        title: "목표 구조 정하기",
        detail: "빠진 구조와 지금 만든다면 둘 모양 정리",
        skills: ["frontend-engineering", "backend-engineering", "webapp-project"],
      },
      {
        title: "빼고 나서 더하기",
        detail: "죽은 코드와 한 번만 쓰는 감싸기부터 제거",
        skills: ["goraebap-mode"],
      },
      {
        title: "호출자 옮기기",
        detail: "호출자를 모두 옮기고 예전 경로는 같은 변경에서 삭제",
        skills: ["frontend-engineering", "backend-engineering"],
      },
      {
        title: "같은 동작 증명",
        detail: "고정한 검증과 실제 화면으로 동작이 그대로인지 확인",
        skills: ["goraebap-mode", "browser"],
      },
      {
        title: "커밋 나누기",
        detail: "빼기, 구조 변경, 정리 순서의 작은 커밋",
        skills: ["webapp-project"],
      },
    ],
    sections: [
      {
        id: "freeze-and-target",
        title: "계약은 고정하고 목표 구조를 먼저 정합니다",
        paragraphs: [
          "리팩터링은 사용자와 호출자가 보는 계약과 동작을 그대로 둔 채 안쪽 구조만 바꾸는 작업입니다. 진행하다가 기능 추가나 버그 수정이 필요하다는 사실을 발견하면 같은 작업에 섞지 않고 따로 떼어 구조 변경을 먼저 끝냅니다.",
          "코드를 옮기기 전에 지금 동작을 특성 테스트, 스냅숏, 비교 실행 같은 검증으로 먼저 고정합니다. 타입 검사와 린트 통과만으로는 동작이 고정되지 않으며, 테스트는 내부 구현이 아니라 사용자가 관찰하는 동작을 단언해야 내부를 바꿔도 통과하고 동작이 깨질 때만 실패합니다. 이어서 지금 처음부터 만든다면 둘 목표 구조를 먼저 정리합니다.",
        ],
      },
      {
        id: "remove-before-add",
        title: "빼고 나서 옮기고, 옛길은 함께 지웁니다",
        paragraphs: [
          "새 구조를 더하기 전에 죽은 코드, 한 번만 쓰는 감싸기, 중복 검증부터 먼저 뺍니다. 낡은 껍데기를 남겨 둔 채 새 구조를 얹으면 코드가 오히려 더 복잡해집니다.",
          "구조를 옮길 때는 작은 단계로 나누어 매 단계 검증을 통과시킵니다. 내부 API를 바꾸면 모든 호출자를 새 구조로 옮기고 예전 API는 같은 변경에서 지웁니다. 호환용 다리나 옛길과 새길을 함께 두지 않으며, 이름을 바꿀 때는 코드뿐 아니라 문자열과 문서 속 참조까지 확인합니다.",
        ],
      },
      {
        id: "prove-and-commit",
        title: "같은 동작을 증명하고 작은 커밋으로 나눕니다",
        paragraphs: [
          "컴파일된다는 확인으로 멈추지 않고, 처음 고정한 검증과 실제 화면 확인으로 동작이 그대로임을 증명합니다. 작업을 마친 뒤에도 코드를 읽는 사람의 부담이 줄지 않았다면 억지로 밀어붙이지 않고 되돌립니다.",
          "커밋은 불필요한 코드를 빼는 커밋, 구조를 바꾸는 커밋, 마무리를 정리하는 커밋 순서로 작게 나눕니다. 단계가 커밋 경계로 나뉘어 있어야 동작이 바뀌지 않았음을 확인하기 쉽습니다.",
        ],
      },
    ],
  },
  {
    slug: "deploy",
    title: "배포",
    icon: "rocket",
    phase: "출시",
    summary:
      "브랜치·커밋 정리부터 임시 작업 폴더 빌드, 링크 전환 롤백, 운영 화면 확인까지의 출시 절차",
    skill: `${PLAYBOOK}deploy.md`,
    steps: [
      {
        title: "변경 묶기",
        detail: "배포할 커밋 정리와 머지 요청·검사 통과",
        skills: ["webapp-project"],
      },
      {
        title: "배포 실행",
        detail: "정해 둔 절차로 배포하고 롤백 경로 유지",
        skills: ["deploy-procedure", "webapp-project"],
      },
      {
        title: "운영 화면 확인",
        detail: "실제 주소에서 주요 화면과 예전 주소 확인",
        skills: ["browser"],
      },
      {
        title: "배포 기록",
        detail: "올린 버전과 바뀐 내용 업무 기록에 정리",
        skills: ["issue-tool"],
      },
    ],
    sections: [
      {
        id: "branch-and-commit",
        title: "브랜치와 커밋을 정리해 배포 단위를 묶습니다",
        paragraphs: [
          "배포 전에 올릴 변경을 브랜치와 커밋 단위로 정리합니다. 브랜치는 GitHub Flow를 따라 기본 브랜치인 main 최신에서 따고, 한 브랜치에는 한 가지 일만 담습니다. 혼자 관리하는 저장소에서는 기본 브랜치에 바로 합치지만, 협업 저장소에서는 PR을 리뷰와 CI 관문으로 씁니다. 브랜치 이름은 Conventional Branch 형식을 따라 <목적>/<짧은 설명>으로 짓고, 에이전트나 도구, 사람 이름은 접두사로 쓰지 않습니다.",
          "커밋은 하나의 논리적 변경 단위로 나누되, 그 변경을 설명하는 요구사항·설계·결정 기록과 스키마·API 계약·생성 산출물·테스트처럼 함께 맞아야 하는 파일은 같은 커밋에 담습니다. 버전을 올릴 때는 내부 구현 정리보다 쓰는 사람이 체감하는 변경만 Added·Changed·Removed·Fixed 네 절로 적고, 한 번 게시한 버전은 덮어쓰지 않고 새 수정 버전을 발급합니다.",
        ],
        table: {
          after: 0,
          monoFirstColumn: true,
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
        id: "script-and-rollback",
        title: "임시 작업 폴더에서 빌드해 올리고 링크로 되돌립니다",
        paragraphs: [
          "작은 제품에 과한 인프라를 얹기보다, 저장소 루트에서 정해 둔 배포 절차 하나로 빌드부터 교체까지 끝내는 구조를 선호합니다. 기본 대상은 main이며, 지금 작업 중인 폴더를 건드리지 않기 위해 지정한 커밋을 임시 작업 폴더인 git worktree에 꺼내 빌드합니다.",
          "빌드 결과는 서버의 releases/<시각-커밋> 폴더에 풀고 current 링크만 새 폴더로 바꿉니다. 이전 배포는 최근 5개만 남기고 정리하며, 접속 정보 같은 비밀값은 Git에서 제외한 .env 파일에 둡니다. 문제가 생기면 소스를 다시 빌드하지 않고 롤백 옵션으로 current 링크를 바로 전 배포 폴더로 되돌립니다.",
        ],
      },
      {
        id: "verify-and-record",
        title: "실제 주소에서 확인하고 배포 기록을 남깁니다",
        paragraphs: [
          "배포가 끝나면 실제 운영 주소를 브라우저에서 직접 열어 주요 화면과 링크, 주소를 옮겼을 때의 예전 주소 돌려보내기가 정상인지 확인합니다.",
          "이상이 없으면 프로젝트가 정한 이슈 도구와 업무 기록에 올린 버전과 핵심 변경 내용을 남깁니다. 배포와 게시는 사용자가 요청하고 허용한 범위에서만 실행합니다.",
        ],
      },
    ],
  },
  {
    slug: "writing",
    title: "글 다듬기",
    icon: "font",
    phase: "상시",
    summary: "글쓰기 기준을 확인하고 글쓰기 역할에 맡긴 뒤 근거와 문체를 대조하는 문서 절차",
    skill: `${PLAYBOOK}writing.md`,
    steps: [
      {
        title: "기준 읽기",
        detail: "글쓰기 기준과 독자, 글이 놓일 자리 확정",
        skills: ["goraebap-mode"],
      },
      {
        title: "글쓰기 역할에 맡기기",
        detail: "근거 자료와 금지 사항을 적어 글쓰기 위임",
        skills: ["writer-role"],
      },
      {
        title: "대조하고 고치기",
        detail: "근거에 없는 문장과 어색한 문투 제거",
        skills: ["goraebap-mode"],
      },
    ],
    sections: [
      {
        id: "delegate-with-evidence",
        title: "근거를 모아 글쓰기 역할에 맡깁니다",
        paragraphs: [
          "사람이 읽는 문서와 스킬·참고 자료 본문은 작업하던 에이전트가 즉흥으로 쓰지 않고 글쓰기 역할에 맡깁니다. 먼저 글쓰기 기준을 읽고, 독자가 누구인지와 글이 놓일 자리를 분명히 정합니다.",
          "맡길 때는 목적과 독자, 확인한 사실과 근거 파일 경로, 바꾸면 안 되는 규칙·코드·링크·제목을 정리해 한 번에 넘깁니다. 완성된 문장을 대신 적어 주거나 근거에 없는 내용을 추측으로 채우게 두지 않습니다. 코드와 주석, 커밋 메시지, 대화 답변은 맡기지 않고 직접 씁니다.",
        ],
      },
      {
        id: "cross-check-and-polish",
        title: "원문과 대조하고 어색한 문투를 걷어 냅니다",
        paragraphs: [
          "결과가 돌아오면 맡긴 쪽에서 원문과 대조합니다. 링크·제목·코드·표 열 수가 깨지지 않았는지, 근거에 없는 주장이 섞이지 않았는지, 변천 설명이나 홍보 문구가 들어가지 않았는지를 확인합니다.",
          "틀린 사실이나 어색한 문투를 찾으면 바로 덮어쓰지 않고 바로잡을 사실을 적어 다시 맡기며, 과장과 반복 표현을 걷어 냅니다.",
        ],
      },
    ],
  },
  {
    slug: "records",
    title: "이슈·업무 기록",
    icon: "file",
    phase: "상시",
    summary: "기존 이슈 탐색부터 상태 전환, 검증 결과와 남은 일 정리까지 이어 가는 기록 절차",
    skill: `${PLAYBOOK}records.md`,
    steps: [
      {
        title: "기존 기록 찾기",
        detail: "같은 일을 다루는 기존 이슈와 문서 우선 탐색",
        skills: ["issue-tool"],
      },
      {
        title: "상태 옮기기",
        detail: "시작 시 진행 중, 완료 시 검토나 완료로 상태 변경",
        skills: ["issue-tool"],
      },
      {
        title: "한 일과 남은 일 남기기",
        detail: "검증 결과와 남은 일을 이슈에 적고 문서 연결",
        skills: ["issue-tool"],
      },
    ],
    sections: [
      {
        id: "find-and-track",
        title: "새로 만들기 전에 기존 기록부터 찾습니다",
        paragraphs: [
          "업무 기록과 이슈는 프로젝트가 정한 이슈 도구에 남깁니다. 작업을 시작할 때 무작정 새 이슈를 만들기보다, 같은 주제를 다루는 기존 이슈와 문서가 있는지 먼저 찾아 맥락이 흩어지지 않게 합니다. 단순 조회나 짧은 질문처럼 기록할 변경이 없는 일에는 억지로 이슈를 만들지 않습니다.",
          "일을 잡으면 상태를 진행 중으로 옮기고, 구현이나 확인이 끝나면 검토나 완료로 옮깁니다. 상태가 실제 진행과 맞아야 다음 세션이나 다른 날 이어서 볼 때 지금 어디까지 왔는지 바로 알 수 있습니다.",
        ],
      },
      {
        id: "write-what-matters",
        title: "한 일, 검증한 것, 남은 일을 구분해 남깁니다",
        paragraphs: [
          "작업을 마칠 때는 바꾼 내용만 나열하지 않고, 실제로 수행한 검증과 아직 확인하지 못한 제한 사항, 다음에 이어서 할 일을 구분해 이슈에 적습니다. 관련 요구사항이나 설계 문서가 있으면 함께 연결해 둡니다.",
          "자동 검사 통과와 실제 브라우저 확인을 섞어 적지 않고, 하지 않은 일은 완료로 표시하지 않습니다.",
        ],
      },
    ],
  },
  {
    slug: "evolve",
    title: "지침 개선",
    icon: "book",
    phase: "상시",
    summary:
      "반복 실수의 원인을 가리고 프로젝트 예외와 공통 지침을 나누어 고친 뒤 버전을 올리는 개선 절차",
    skill: `${PLAYBOOK}evolve.md`,
    steps: [
      {
        title: "원인 찾기",
        detail: "반복 실수가 빠진 규칙·도구·검증 중 무엇인지 판별",
        skills: ["goraebap-mode"],
      },
      {
        title: "자리 정하기",
        detail: "프로젝트 예외와 공통 지침·어댑터 대상 구분",
        skills: ["onboarding"],
      },
      {
        title: "지침 고치기",
        detail: "스킬 수정과 짝을 이루는 사이트 문서 동기화",
        skills: ["skill-creator", "writer-role"],
      },
      {
        title: "버전 올리기",
        detail: "검사와 패키징을 거쳐 새 버전 설치",
        skills: ["webapp-project"],
      },
    ],
    sections: [
      {
        id: "diagnose-and-place",
        title: "실수의 원인과 놓일 자리를 먼저 가립니다",
        paragraphs: [
          "같은 실수가 반복되거나 지침이 현실과 어긋나면, 먼저 빠진 규칙인지 잘못된 도구인지 놓친 검증인지를 가립니다. 한 번 겪은 특수 사례를 곧장 모든 프로젝트의 절대 규칙으로 올리지 않고, 문구 경고를 늘리기 전에 자동 검사나 구조로 막을 수 있는지도 먼저 따집니다.",
          "원인이 잡히면 이 프로젝트만의 예외인지, 여러 프로젝트에 맞는 공통 개선인지 나눕니다. 공통 개선도 스택과 무관한 핵심 지침 대상인지 특정 스택의 어댑터 대상인지를 가릅니다. 당장 판단이 서지 않으면 프로젝트의 AGENTS.md 프로젝트 규칙 표에 이유와 함께 먼저 두고 지켜봅니다.",
        ],
        table: {
          after: 1,
          columns: ["대상", "놓는 자리", "기준"],
          rows: [
            [
              "이 프로젝트 예외",
              "프로젝트 AGENTS.md 프로젝트 규칙 표",
              "제품 제약, 기존 시스템, 팀 합의",
            ],
            ["공통 핵심 지침", "plugins/webapp/skills/", "스택과 무관한 판단 기준과 절차"],
            ["스택별 어댑터", "plugins/webapp/adapters/", "특정 스택·라이브러리의 구현 견본"],
          ],
        },
      },
      {
        id: "update-and-sync",
        title: "스킬을 고치면 사이트 글도 함께 맞춥니다",
        paragraphs: [
          "공통 지침을 고칠 때는 원본 저장소에서 범용성, 기존 결정과의 정합성, 지침과 어댑터 경계, 안전성, 유지 비용을 확인한 뒤 스킬 문서를 고칩니다. 스킬 본문 수정도 글쓰기 기준에 따라 글쓰기 역할에 맡겨 다듬습니다.",
          "이 사이트의 문서는 스킬을 사람이 읽는 글로 옮긴 짝이므로, 스킬을 고치면 그 스킬을 가리키는 사이트 문서도 같은 변경에서 함께 맞춥니다.",
        ],
      },
      {
        id: "release-new-version",
        title: "검사와 패키징을 거쳐 새 버전을 설치합니다",
        paragraphs: [
          "수정이 끝나면 플러그인 검사와 사이트 타입·스킬 링크 검사를 통과시키고, 패키징으로 배포본을 만든 뒤 새 버전을 설치합니다.",
          "플러그인이 갱신되면 연결된 프로젝트에서 이미 공통 지침에 반영된 프로젝트 규칙 표의 줄을 정리합니다.",
        ],
      },
    ],
  },
];
