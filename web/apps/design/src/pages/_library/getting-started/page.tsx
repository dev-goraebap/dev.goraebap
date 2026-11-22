import { Link, createFileRoute } from "@tanstack/react-router";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/_library/getting-started/")({
  component: GettingStartedPage,
});

const NEXT_STEPS = [
  {
    title: "Design Tokens",
    summary: "App·Editorial 세트의 색상, 반경, 타이포그래피 값을 조회하고 var() 변수를 복사합니다.",
    to: "/foundations/tokens" as const,
  },
  {
    title: "Style Recipes",
    summary: "CVA와 Tailwind 클래스로 만든 스타일 레시피 함수의 구조와 사용 기준을 확인합니다.",
    to: "/foundations/recipes" as const,
  },
  {
    title: "Pure HTML & Primitives",
    summary: "네이티브 HTML과 헤드리스 프리미티브의 경계, 프레임워크별 연결 방식을 다룹니다.",
    to: "/adapters/primitives" as const,
  },
  {
    title: "Components",
    summary: "Base UI 위에 만든 React 컴포넌트 13종의 미리보기와 사용 코드를 제공합니다.",
    to: "/components" as const,
  },
  {
    title: "Templates",
    summary: "Inset AppShell과 Responsive Dialog 두 가지 화면 템플릿을 제공합니다.",
    to: "/templates" as const,
  },
];

function GettingStartedPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight">시작하기</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          워크스페이스 앱에 @goraebap/design-system과 @goraebap/ui를 연결하고 스타일, 테마,
          컴포넌트를 적용합니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">패키지 연결</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          @goraebap/design-system과 @goraebap/ui는 npm 공개 패키지가 아니라 저장소 안의 비공개 pnpm
          워크스페이스 패키지입니다. 앱의 package.json에 workspace:*로 의존성을 추가합니다.
        </p>
        <CopyCodeBlock
          label="package.json"
          language="json"
          code={`{
  "dependencies": {
    "@goraebap/design-system": "workspace:*",
    "@goraebap/ui": "workspace:*"
  }
}`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">스타일 연결</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          base.css가 tailwindcss와 tw-animate-css를 불러오고 폰트, 색상 유틸리티, 반경 단계를
          정의하므로 앱 CSS에서 tailwindcss를 따로 불러오지 않아도 됩니다. theme-app.css와
          theme-editorial.css는 모두 :root에 값을 선언하므로 나중에 불러온 파일이 페이지의 기본
          세트가 됩니다. @source는 Tailwind가 패키지 안의 클래스를 찾게 하며, 경로는 CSS 파일 위치에
          따라 달라집니다. 아래 예시는 web/apps/&lt;앱&gt;/src/app/theme/tailwind.css 기준입니다.
        </p>
        <CopyCodeBlock
          label="src/app/theme/tailwind.css"
          language="css"
          code={`@import "@goraebap/design-system/styles/base.css";
@import "@goraebap/design-system/styles/theme-app.css";
@import "@goraebap/design-system/styles/theme-editorial.css";

@source "../../../../../packages/design-system/src";
@source "../../../../../packages/ui/src";`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">테마 지정</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          작업 화면에는 중립 무채색의 app을, 긴 글에는 따뜻한 종이 톤의 editorial을 씁니다. 요소에
          data-ds-theme="app" 또는 data-ds-theme="editorial"을 달면 해당 영역에 그 토큰 세트가
          적용됩니다. 다크 모드는 html 같은 상위 요소에 dark 클래스를 붙여 켭니다.
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
          React 앱에서는 Base UI 위에 만든 @goraebap/ui/components/&lt;이름&gt; 컴포넌트를 가져다
          씁니다. 프레임워크 없는 페이지나 Angular에서는 클래스 문자열을 반환하는 레시피 함수를 직접
          호출해 요소에 적용합니다.
        </p>
        <CopyCodeBlock
          label="SaveButton.tsx"
          language="tsx"
          code={`import { Button } from "@goraebap/ui/components/button";

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
