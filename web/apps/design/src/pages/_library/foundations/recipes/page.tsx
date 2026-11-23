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
          스타일 레시피는 컴포넌트의 외형과 변형(variant) 규칙을 프레임워크와 분리해 정의한 스타일
          계층입니다. <code>tailwind-variants</code>와 Tailwind 클래스를 조합한 TypeScript 함수로
          구현하며, React와 Angular 환경에서 같은 규칙을 공유합니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">레시피 구조 예시</h2>
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
            반경이나 포커스 링 같은 시각 규칙을 한 곳에서 수정하면 같은 레시피를 쓰는 모든 환경에
            함께 반영됩니다.
          </li>
          <li>
            컴포넌트를 렌더링하지 않고도 레시피 함수의 반환값만으로 variant 조합을 검증할 수
            있습니다.
          </li>
          <li>
            복잡한 상태 관리가 필요 없는 화면에서는 별도 UI 라이브러리 없이 레시피 함수만으로
            스타일을 적용합니다.
          </li>
        </ul>
      </section>
    </article>
  );
}
