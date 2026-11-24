import { createFileRoute } from "@tanstack/react-router";
import { Separator } from "@goraebap/ui-react/components/separator";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/webapp/agents/")({
  component: AgentsPage,
});

const PLUGIN_SCOPES = [
  {
    title: "Webapp",
    skills: "goraebap-mode · onboarding · webapp-project",
    summary:
      "작업 절차, 검증, 이어받기, 글쓰기와 프로젝트 연결, 모듈 경계·형상관리·운영 설계의 기준을 다룹니다.",
  },
  {
    title: "Frontend",
    skills: "frontend-engineering · frontend-design-system · frontend-interaction",
    summary: "화면 계층과 데이터 흐름, 디자인 시스템, 화면의 반응과 움직임의 기준을 다룹니다.",
  },
  {
    title: "Backend",
    skills: "backend-engineering",
    summary: "모듈 구조, 모듈 간 계약, 조회와 오류, API 계약, 스키마 변경의 기준을 다룹니다.",
  },
];

const INSTALLS = [
  {
    label: "Claude Code",
    code: `/plugin marketplace add dev-goraebap/dev.goraebap --scope user
/plugin install webapp@dev-goraebap --scope user`,
  },
  {
    label: "Codex",
    code: `codex plugin marketplace add https://github.com/dev-goraebap/dev.goraebap.git --ref main
codex plugin add webapp@dev-goraebap`,
  },
];

function AgentsPage() {
  return (
    <article className="max-w-3xl space-y-10 [overflow-wrap:anywhere]">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          이 사이트에 정리한 기준을 AI 에이전트가 읽고 따르게 하는 플러그인
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="font-mono text-lg font-semibold tracking-tight">webapp@dev-goraebap</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          웹 앱 개발 절차, 아키텍처, API, DB, 백엔드, 프론트엔드, UI/UX 기준을 하나의 플러그인으로
          묶었습니다. 에이전트는 평소 각 지침의 한 줄 설명만 보고, 작업에 맞는 지침만 열어 읽습니다.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLUGIN_SCOPES.map((scope) => (
            <div
              key={scope.title}
              className="border-border bg-card space-y-1 rounded-2xl border p-5"
            >
              <h3 className="text-sm font-semibold">{scope.title}</h3>
              <p className="text-muted-foreground font-mono text-[0.6875rem]">{scope.skills}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{scope.summary}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator variant="wave" />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">설치</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          에이전트에게 "dev-goraebap 마켓플레이스에서 webapp@dev-goraebap 플러그인을 설치해 줘"라고
          부탁하거나, 아래 명령을 직접 실행합니다.
        </p>
        {INSTALLS.map((install) => (
          <CopyCodeBlock
            key={install.label}
            label={install.label}
            language="bash"
            code={install.code}
          />
        ))}
        <p className="text-muted-foreground text-base leading-relaxed">
          Antigravity는 저장소의 plugins/webapp/dist/antigravity/plugins/webapp 폴더를
          ~/.gemini/config/plugins/webapp에 복사하거나 연결하면 불러옵니다.
        </p>
      </section>
    </article>
  );
}
