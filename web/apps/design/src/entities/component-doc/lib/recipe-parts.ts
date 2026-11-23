interface RecipeFunction {
  (props: { [axis: string]: string | undefined }): string;
  variants?: Record<string, Record<string, unknown>>;
  defaultVariants?: Record<string, unknown>;
}

export interface RecipePart {
  name: string;
  recipe: RecipeFunction;
}

const RECIPE_MODULES = import.meta.glob<Record<string, unknown>>(
  "../../../../../../packages/design-system/src/recipes/*.ts",
  { eager: true },
);

const toCamelCase = (slug: string) =>
  slug.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

const axisCount = (part: RecipePart) => Object.keys(part.recipe.variants ?? {}).length;

// 컴포넌트와 이름이 같은 레시피를 먼저, 그다음 옵션이 있는 레시피를 먼저 보여 준다.
export function getRecipeParts(slug: string): RecipePart[] {
  const suffix = `/recipes/${slug}.ts`;
  const module = Object.entries(RECIPE_MODULES).find(([file]) => file.endsWith(suffix))?.[1];
  if (!module) return [];
  const rootName = toCamelCase(slug);
  const rank = (part: RecipePart) => (part.name === rootName ? 0 : axisCount(part) > 0 ? 1 : 2);
  return Object.entries(module)
    .filter(([name, value]) => name.endsWith("Variants") && typeof value === "function")
    .map(([name, value]) => ({
      name: name.replace(/Variants$/, ""),
      recipe: value as RecipeFunction,
    }))
    .sort((a, b) => rank(a) - rank(b));
}

export function getRecipeAxes(parts: RecipePart[]) {
  const axes = new Map<string, { options: string[]; defaultValue: string }>();
  for (const { recipe } of parts) {
    for (const [axis, options] of Object.entries(recipe.variants ?? {})) {
      if (axes.has(axis)) continue;
      axes.set(axis, {
        options: Object.keys(options),
        defaultValue: String(recipe.defaultVariants?.[axis]),
      });
    }
  }
  return [...axes].map(([name, axis]) => ({ name, ...axis }));
}
