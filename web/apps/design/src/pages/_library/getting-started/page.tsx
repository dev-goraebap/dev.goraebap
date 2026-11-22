import { Link, createFileRoute } from "@tanstack/react-router";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/_library/getting-started/")({
  component: GettingStartedPage,
});

const NEXT_STEPS = [
  {
    title: "디자인 토큰",
    summary: "색상, 반경, 타이포그래피 토큰의 구성과 App·Editorial 세트별 값을 확인합니다.",
    to: "/foundations/tokens" as const,
  },
  {
    title: "스타일 레시피",
    summary: "프레임워크에 독립적인 스타일 레시피의 역할과 변형 규칙을 확인합니다.",
    to: "/foundations/recipes" as const,
  },
  {
    title: "Pure HTML & Primitives",
    summary: "네이티브 HTML과 헤드리스 프리미티브를 나누는 기준과 환경별 연결 방식을 다룹니다.",
    to: "/adapters/primitives" as const,
  },
  {
    title: "컴포넌트",
    summary: "Base UI 기반 React 컴포넌트 36종의 동작과 사용 예제를 확인합니다.",
    to: "/components" as const,
  },
  {
    title: "템플릿",
    summary: "Inset AppShell과 Responsive Dialog의 화면 구성과 반응형 전환을 확인합니다.",
    to: "/templates" as const,
  },
];

function GettingStartedPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight">시작하기</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          워크스페이스 앱에 @goraebap/design-system과 @goraebap/ui-react를 연결해 스타일, 테마, 컴포넌트를
          적용합니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">패키지 연결</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          @goraebap/design-system과 @goraebap/ui-react는 저장소 내부의 pnpm 워크스페이스 패키지입니다. 앱의
          package.json에 workspace:* 의존성으로 추가합니다.
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
        <p className="text-muted-foreground text-sm leading-relaxed">
          앱의 엔트리 CSS에서 base.css와 테마 파일을 불러오고, @source로 디자인 시스템 패키지의 소스
          경로를 지정합니다. base.css가 tailwindcss와 기본 유틸리티를 포함하므로 앱에서 tailwindcss를
          따로 불러오지 않습니다. 두 테마 파일 모두 :root를 선언하므로 나중에 불러온 파일이 기본
          세트가 되며, @source 경로는 CSS 파일 위치(아래 예시는
          web/apps/&lt;앱&gt;/src/app/theme/tailwind.css)에 맞춰 조정합니다.
        </p>
        <CopyCodeBlock
          label="src/app/theme/tailwind.css"
          language="css"
          code={`@import "@goraebap/design-system/styles/base.css";
@import "@goraebap/design-system/styles/theme-app.css";
@import "@goraebap/design-system/styles/theme-editorial.css";

@source "../../../../../packages/design-system/src";
@source "../../../../../packages/ui-react/src";`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">테마 지정</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          요소에 data-ds-theme="app" 또는 data-ds-theme="editorial"을 지정해 영역별로 토큰 세트를
          적용합니다. 작업 화면에는 중립 무채색의 app, 긴 글에는 따뜻한 종이 톤의 editorial을 쓰며,
          다크 모드는 html 같은 상위 요소에 dark 클래스를 붙여 전환합니다.
        </p>
        <CopyCodeBlock
          label="index.html"
          language="html"
          code={`<html class="dark">
  <body data-ds-theme="app">
    <article data-ds-theme="editorial">...</article>
  </body>
</html>`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">첫 컴포넌트 쓰기</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          React 앱에서는 Base UI 위에 구성한 @goraebap/ui-react/components/&lt;이름&gt; 컴포넌트를
          사용합니다. 프레임워크가 없는 페이지나 Angular에서는 스타일 레시피 함수를 직접 호출해
          클래스를 적용합니다.
        </p>
        <CopyCodeBlock
          label="SaveButton.tsx"
          language="tsx"
          code={`import { Button } from "@goraebap/ui-react/components/button";

export function SaveButton() {
  return <Button size="sm">저장</Button>;
}`}
        />
        <CopyCodeBlock
          label="save-button.ts"
          language="ts"
          code={`import { buttonVariants } from "@goraebap/design-system/recipes/button";

const button = document.querySelector("button");
if (button) button.className = buttonVariants({ size: "sm" });`}
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
              <p className="text-muted-foreground text-xs leading-relaxed">{step.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
