import { createFileRoute } from "@tanstack/react-router";
import buttonRecipeSource from "@goraebap/design-system/recipes/button?raw";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/docs/recipes/")({
  component: DocsRecipesPage,
});

function DocsRecipesPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Style Recipes</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          레시피는 <code>class-variance-authority (CVA)</code>와 Tailwind v4 클래스로 작성한
          TypeScript 함수입니다. React나 Angular 런타임에 의존하지 않아 Pure HTML 요소에도 적용할 수
          있습니다.
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
        <h2 className="text-base font-semibold">왜 레시피를 분리할까?</h2>
        <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>
            버튼 반경이나 포커스 링을 한 번 고치면 같은 레시피를 쓰는 Pure HTML, React, Angular
            코드에 함께 반영됩니다.
          </li>
          <li>
            프레임워크 컴포넌트를 마운트하지 않고도 함수 반환 문자열로 variant 조합을 테스트할 수
            있습니다.
          </li>
          <li>
            인터랙션이 단순한 정적 페이지에서는 UI 라이브러리 없이 레시피 함수만 가져다 씁니다.
          </li>
        </ul>
      </section>
    </article>
  );
}
