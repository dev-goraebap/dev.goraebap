import { useEffect, useState } from "react";

const RECIPE_LOADERS = import.meta.glob<string>(
  "../../../../../../packages/design-system/src/recipes/*.ts",
  { query: "?raw", import: "default" },
);

function findLoader(slug: string) {
  const suffix = `/recipes/${slug}.ts`;
  return Object.entries(RECIPE_LOADERS).find(([file]) => file.endsWith(suffix))?.[1];
}

export function useRecipeSource(slug: string | undefined) {
  const [loaded, setLoaded] = useState<{ slug: string; code: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    void findLoader(slug)?.().then((code) => {
      if (!cancelled) setLoaded({ slug, code: code.trimEnd() });
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return loaded?.slug === slug ? loaded?.code : undefined;
}
