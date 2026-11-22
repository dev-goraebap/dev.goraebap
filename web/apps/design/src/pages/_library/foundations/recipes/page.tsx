import { createFileRoute } from "@tanstack/react-router";
import buttonRecipeSource from "@goraebap/design-system/recipes/button?raw";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/_library/foundations/recipes/")({
  component: DocsRecipesPage,
});

function DocsRecipesPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Style Recipes</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          레시피는 <code>class-variance-authority (CVA)</code>와 Tailwind 클래스로 만든 TypeScript
          함수이며 클래스 문자열을 반환합니다. 특정 프레임워크 런타임에 의존하지 않아 React
          컴포넌트, 프레임워크 없는 페이지, Angular에서 함께 씁니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">하나의 레시피, 세 곳의 소비자</h2>
        <CopyCodeBlock
          label="packages/design-system/src/recipes/button.ts"
          language="ts"
          code={buttonRecipeSource.trimEnd()}
        />
      </section>

      <section className="border-border bg-card space-y-3 rounded-2xl border p-6">
        <h2 className="text-base font-semibold">레시피를 분리하는 이유</h2>
        <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>
            버튼 반경이나 포커스 링을 한 번 고치면 같은 레시피를 호출하는 Pure HTML, React, Angular
            코드에 함께 반영됩니다.
          </li>
          <li>
            컴포넌트를 마운트하지 않고도 함수가 반환하는 클래스 문자열로 variant 조합을 검증합니다.
          </li>
          <li>
            상호작용이 단순한 페이지에서는 별도 UI 라이브러리 없이 레시피 함수만 가져다 씁니다.
          </li>
        </ul>
      </section>
    </article>
  );
}
