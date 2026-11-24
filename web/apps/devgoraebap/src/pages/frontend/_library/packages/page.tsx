import { Link, createFileRoute } from "@tanstack/react-router";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/frontend/_library/packages/")({
  component: PackagesPage,
});

const NEXT_STEPS = [
  {
    title: "디자인 토큰",
    summary: "색상, 반경, 타이포그래피 토큰의 구성과 5가지 색상 테마별 값을 확인합니다.",
    to: "/frontend/foundations/tokens" as const,
  },
  {
    title: "스타일 레시피",
    summary: "프레임워크에 독립적인 스타일 레시피의 역할과 변형 규칙을 확인합니다.",
    to: "/frontend/foundations/recipes" as const,
  },
  {
    title: "컴포넌트",
    summary: "Base UI 기반 React 컴포넌트의 동작과 사용 예제를 확인합니다.",
    to: "/frontend/components" as const,
  },
  {
    title: "레이아웃",
    summary: "Inset AppShell과 Responsive Dialog의 화면 구성과 반응형 전환을 확인합니다.",
    to: "/frontend/layouts" as const,
  },
];

function PackagesPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight">패키지 연결</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          프로젝트에 @goraebap/design-system과 @goraebap/ui-react를 연결해 스타일, 테마, 컴포넌트를
          적용하는 방법
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">패키지 연결</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          공통 스타일과 레시피는 @goraebap/design-system에 두고, React 앱은 @goraebap/ui-react를
          함께 연결합니다.
        </p>
        <CopyCodeBlock
          label="package.json"
          language="json"
          code={`{
"dependencies": {
  "@goraebap/design-system": "workspace:*",
  "@goraebap/ui-react": "workspace:*"
}
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">스타일 연결</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          앱의 엔트리 CSS에서 base.css와 색상 테마 파일을 불러오고, @source로 디자인 시스템 패키지의
          소스 경로를 지정합니다. base.css가 tailwindcss와 기본 유틸리티를 포함하므로 앱에서
          tailwindcss를 따로 불러오지 않습니다. theme-app.css를 먼저 불러와 기본(:root)으로 두고,
          필요한 색상 테마 파일을 그 아래에 이어서 불러옵니다.
        </p>
        <CopyCodeBlock
          label="src/app/theme/tailwind.css"
          language="css"
          code={`@import "@goraebap/design-system/styles/base.css";
@import "@goraebap/design-system/styles/theme-app.css";
@import "@goraebap/design-system/styles/theme-editorial.css";
@import "@goraebap/design-system/styles/theme-ocean.css";
@import "@goraebap/design-system/styles/theme-forest.css";
@import "@goraebap/design-system/styles/theme-terracotta.css";

@source "../../../../../packages/design-system/src";
@source "../../../../../packages/ui-react/src";`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">색상 테마 지정</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          요소에 data-ds-theme="app" | "editorial" | "ocean" | "forest" | "terracotta"를 지정해
          영역별로 토큰 세트를 적용합니다. 다크 모드는 html 같은 상위 요소에 dark 클래스를 붙여
          전환합니다.
        </p>
        <CopyCodeBlock
          label="index.html"
          language="html"
          code={`<html class="dark" data-ds-theme="app">
<body>
  <article data-ds-theme="editorial">...</article>
</body>
</html>`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">첫 컴포넌트 쓰기</h2>
        <p className="text-muted-foreground text-base leading-relaxed">
          React 앱에서는 Base UI 기반의 @goraebap/ui-react 컴포넌트를 쓰고, Angular 앱에서는 Spartan
          Brain 프리미티브에 @goraebap/design-system 레시피를 결합해 사용합니다.
        </p>
        <CopyCodeBlock
          label="SaveButton.tsx (React)"
          language="tsx"
          code={`import { Button } from "@goraebap/ui-react/components/button";

export function SaveButton() {
return <Button size="sm">저장</Button>;
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">다음 단계</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {NEXT_STEPS.map((step) => (
            <Link
              key={step.to}
              to={step.to}
              className="border-border bg-card hover:border-foreground/30 space-y-1 rounded-2xl border p-5 transition-colors"
            >
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
