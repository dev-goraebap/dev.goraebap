import { createFileRoute } from "@tanstack/react-router";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/docs/recipes/")({
  component: DocsRecipesPage,
});

function DocsRecipesPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <p className="text-muted-foreground font-mono text-xs">LAYER 02 · FOUNDATIONS</p>
        <h1 className="text-3xl font-semibold tracking-tight">Style Recipes</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          레시피는 <code>class-variance-authority (CVA)</code>와 Tailwind v4 유틸리티로 작성한 순수
          TypeScript 함수입니다. React나 Angular 런타임에 전혀 의존하지 않으므로 Pure HTML에도 바로
          입힐 수 있습니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">하나의 레시피, 세 곳의 소비자</h2>
        <CopyCodeBlock
          label="packages/design-system/src/recipes/button.ts"
          language="ts"
          code={`import { cva, type VariantProps } from "class-variance-authority";

export const buttonRecipe = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
      },
      size: { sm: "h-8 px-3 text-xs", default: "h-9 px-4", lg: "h-10 px-5" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonRecipe>;`}
        />
      </section>

      <section className="border-border bg-card space-y-3 rounded-2xl border p-6">
        <h2 className="text-base font-semibold">왜 레시피를 분리할까?</h2>
        <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>
            <strong>시각적 일관성</strong>: 버튼 반경이나 포커스 링을 한 번 고치면 Pure HTML, React,
            Angular 앱이 동시에 바뀝니다.
          </li>
          <li>
            <strong>테스트 용이성</strong>: 프레임워크 마운트 없이 순수 문자열 함수로 variant 조합을
            검증할 수 있습니다.
          </li>
          <li>
            <strong>점진적 채택</strong>: 인터랙션이 단순한 정적 페이지에서는 UI 라이브러리 없이
            레시피만 가져다 써도 됩니다.
          </li>
        </ul>
      </section>
    </article>
  );
}
