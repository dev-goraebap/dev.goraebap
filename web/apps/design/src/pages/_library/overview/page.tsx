import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui-react/components/badge";
import { Separator } from "@goraebap/ui-react/components/separator";

export const Route = createFileRoute("/_library/overview/")({
  component: OverviewPage,
});

const PAIN_POINTS = [
  {
    title: "라이브러리별 기본 리셋과 스케일 충돌",
    body: "프로토타입은 Tailwind나 생 CSS로 만들었는데, React나 Angular UI 라이브러리로 옮기면 각 라이브러리가 강제하는 기본 여백, line-height, 포커스 링, 반경 스케일이 겹쳐 높이와 간격이 미묘하게 틀어집니다.",
  },
  {
    title: "컴포넌트 DOM과 스타일의 결합",
    body: "스타일이 특정 프레임워크 컴포넌트 안에 묶여 있으면 HTML 프로토타입의 클래스를 그대로 가져다 쓸 수 없습니다. 특히 Angular의 호스트 래퍼 요소와 ViewEncapsulation은 flex·grid 배치까지 다르게 만듭니다.",
  },
  {
    title: "React와 Angular 생태계의 단절",
    body: "React는 Base UI·Radix 같은 헤드리스 프리미티브 + Tailwind 조합이 자리 잡았지만, Angular는 스타일이 결합된 컴포넌트 라이브러리가 주류라 두 진영이 같은 디자인 언어를 공유하기 어려웠습니다.",
  },
];

const LAYER_ROLES = [
  {
    name: "디자인 토큰",
    package: "@goraebap/design-system/styles",
    owns: "5가지 라이트·다크 테마(Neutral·Editorial·Ocean·Forest·Terracotta), 면 위계, 반경, 폰트",
    boundary: "컴포넌트 모양이나 배치를 직접 정의하지 않습니다.",
    to: "/foundations/tokens" as const,
  },
  {
    name: "스타일 레시피",
    package: "@goraebap/design-system/recipes/*",
    owns: "CVA + Tailwind 클래스 문자열, variant·size·shape 규칙",
    boundary: "프레임워크 런타임에 의존하지 않습니다.",
    to: "/foundations/recipes" as const,
  },
  {
    name: "어댑터 컴포넌트",
    package: "@goraebap/ui-html · @goraebap/ui-react · Spartan 예시",
    owns: "키보드 탐색, 포커스 관리, 오버레이, 아이콘 어댑터(Solar·Lucide)",
    boundary: "색상과 여백 규칙을 새로 만들지 않고 레시피를 그대로 입힙니다.",
    to: "/components" as const,
  },
  {
    name: "레이아웃",
    package: "앱 외곽 · 메인 영역",
    owns: "워크스페이스·문서·단일 페이지 골격과 목록·상세·설정·폼 배치",
    boundary: "개별 컴포넌트 내부 스타일을 덮어쓰지 않습니다.",
    to: "/layouts" as const,
  },
  {
    name: "디테일",
    package: "스크롤 · 전환 · 폰트 · 적응형 UI",
    owns: "화면 흔들림 방지, 지연 프로그레스바, View Transition, 모바일 전환 기준",
    boundary: "정답을 강제하기보다 프로젝트를 만들며 꾸준히 챙기는 마감 기준입니다.",
    to: "/details" as const,
  },
];

function ArchitectureDiagram() {
  return (
    <div className="border-border bg-dots bg-background/70 space-y-6 rounded-2xl border p-5 sm:p-7">
      {/* Shared Core */}
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="border-border bg-card rounded-xl border p-4 text-center shadow-xs">
          <p className="text-muted-foreground font-mono text-[11px] uppercase">
            Single Source · Framework-Agnostic
          </p>
          <p className="mt-1 text-sm font-semibold">@goraebap/design-system</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="border-border bg-background rounded-lg border px-3 py-2 text-left">
              <p className="text-xs font-semibold">디자인 토큰 (CSS Variables)</p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                5 Themes (Light/Dark) · Radius · Font
              </p>
            </div>
            <div className="border-border bg-background rounded-lg border px-3 py-2 text-left">
              <p className="text-xs font-semibold">스타일 레시피 (CVA + Tailwind)</p>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                순수 TypeScript 클래스 함수 (런타임 0)
              </p>
            </div>
          </div>
        </div>

        {/* Connector SVG */}
        <svg
          viewBox="0 0 600 44"
          fill="none"
          aria-hidden="true"
          className="text-border mx-auto hidden h-10 w-full max-w-xl sm:block"
        >
          <path d="M300 0V20" stroke="currentColor" strokeWidth="1.5" />
          <path d="M95 20H505" stroke="currentColor" strokeWidth="1.5" />
          <path d="M95 20V44M300 20V44M505 20V44" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* 3 Adapters */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border-border bg-card space-y-2 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">Vanilla HTML/TS</span>
            <Badge variant="outline" className="text-[10px]">
              프로토타입
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Vite + Tailwind 환경에서 프레임워크 없이 네이티브 HTML과 레시피, 경량 DOM 헬퍼를 결합합니다.
          </p>
          <p className="text-muted-foreground font-mono text-[11px]">@goraebap/ui-html</p>
        </div>

        <div className="border-border bg-card space-y-2 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">React</span>
            <Badge variant="secondary" className="text-[10px]">
              개인 프로젝트
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Base UI 프리미티브 위에 같은 레시피와 아이콘 어댑터를 결합해 패키지로 제공합니다.
          </p>
          <p className="text-muted-foreground font-mono text-[11px]">@goraebap/ui-react</p>
        </div>

        <div className="border-border bg-card space-y-2 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">Angular</span>
            <Badge variant="outline" className="text-[10px]">
              업무 프로젝트
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Spartan Brain 프리미티브에 완전히 같은 레시피 함수를 연결해 동일한 UI를 유지합니다.
          </p>
          <p className="text-muted-foreground font-mono text-[11px]">@spartan-ng/brain + Recipes</p>
        </div>
      </div>
    </div>
  );
}

function OverviewPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight">개요</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          goraebap/design은 프로토타입(Vanilla HTML/TS), 개인 프로젝트(React), 업무 프로젝트(Angular)가
          하나의 디자인 기준을 공유하도록 설계한 디자인 시스템입니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">왜 이런 구조를 만들었나요?</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          AI 에이전트로 빠르게 만들어 보고 버리는 프로토타입은 프레임워크 없는 Vanilla HTML/TS(Vite +
          Tailwind)가 가장 가볍고, 개인 프로젝트는 React, 회사 프로젝트는 Angular를 씁니다. 그런데
          프로토타입에서 실제 프론트엔드 앱으로 옮길 때마다 같은 디자인과 레이아웃이 그대로 옮겨지지
          않고 미묘하게 틀어지는 문제가 반복되었습니다.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {PAIN_POINTS.map((item) => (
            <div
              key={item.title}
              className="border-border bg-card space-y-2 rounded-2xl border p-5"
            >
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator variant="wave" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">단일 원본과 어댑터 분리</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          해결책은 시각 규칙(토큰과 스타일 레시피)에서 프레임워크를 완전히 걷어내는 것입니다.
          상호작용이 필요한 컴포넌트만 React의 Base UI와 Angular의 Spartan Brain 같은 헤드리스
          프리미티브로 감싸고, 색·여백·반경·모션은 모두 같은 원본에서 가져옵니다.
        </p>
        <ArchitectureDiagram />
      </section>

      <Separator variant="wave" />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">영역별 역할 경계</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          각 영역이 책임지는 범위를 나누어 두면, 테마를 바꾸거나 프레임워크를 옮겨도 수정 범위가 한
          곳에 머뭅니다.
        </p>
        <div className="space-y-2.5">
          {LAYER_ROLES.map((layer) => (
            <Link
              key={layer.name}
              to={layer.to}
              className="border-border bg-card hover:border-foreground/30 grid gap-2 rounded-2xl border p-4 transition-colors sm:grid-cols-12 sm:items-center"
            >
              <div className="sm:col-span-3">
                <p className="text-sm font-semibold">{layer.name}</p>
                <p className="text-muted-foreground font-mono text-[11px]">{layer.package}</p>
              </div>
              <div className="sm:col-span-5">
                <p className="text-foreground text-xs leading-relaxed">{layer.owns}</p>
              </div>
              <div className="sm:col-span-4">
                <p className="text-muted-foreground text-xs leading-relaxed">{layer.boundary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
