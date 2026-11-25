import { BottomSheetAnatomy, ButtonAnatomy, DialogAnatomy } from "./AnatomyFigure";
import { RecipePlayground } from "./RecipePlayground";
import { useRecipeSource } from "../lib/recipe-source";
import { getComponentDemo } from "../model/catalog";
import { COMPONENT_PLAYGROUNDS } from "../model/playgrounds";

// 컴포넌트 문서(mdx)가 <Demo> 안에서 부르는 견본. 사람에게만 보이고 스킬로 빌드할 때 지워진다.

export function ComponentPlayground({ slug }: { slug: string }) {
  const doc = getComponentDemo(slug);
  const recipeCode = useRecipeSource(slug);
  if (!doc) return null;
  return (
    <RecipePlayground
      key={slug}
      slug={slug}
      doc={doc}
      config={COMPONENT_PLAYGROUNDS[slug]}
      recipeCode={recipeCode}
    />
  );
}

export function ComponentExampleDemo({ slug, id }: { slug: string; id: string }) {
  const example = getComponentDemo(slug)?.examples?.find((item) => item.id === id);
  if (!example) return null;
  return (
    <div className="border-border bg-dots bg-background/70 flex min-h-40 items-center justify-center rounded-2xl border p-6">
      {example.renderReactDemo()}
    </div>
  );
}

const ANATOMY_FIGURES = {
  button: ButtonAnatomy,
  dialog: DialogAnatomy,
  "bottom-sheet": BottomSheetAnatomy,
} as const;

export function ComponentAnatomyFigure({ slug }: { slug: string }) {
  const Figure = ANATOMY_FIGURES[slug as keyof typeof ANATOMY_FIGURES];
  if (!Figure) return null;
  return (
    <div className="border-border bg-dots bg-background/70 flex min-h-64 items-center justify-center rounded-2xl border p-6">
      <Figure />
    </div>
  );
}
