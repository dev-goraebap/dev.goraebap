import { createContext, useContext, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { GLOSSARY, stripGlossaryMarkup, type GlossarySegment } from "@/shared/lib/glossary";
import { GlossaryTerm } from "@/shared/ui";

type GuideTextMap = Record<string, GlossarySegment[]>;

const GuideTextContext = createContext<GuideTextMap>({});

export function GuideTextProvider({
  value,
  children,
}: {
  value: GuideTextMap;
  children: ReactNode;
}) {
  return <GuideTextContext value={value}>{children}</GuideTextContext>;
}

export function GuideText({ at, text }: { at: string; text: string }) {
  const segments = useContext(GuideTextContext)[at] ?? [stripGlossaryMarkup(text)];
  return segments.map((segment, index) => {
    if (typeof segment === "string") return segment;
    const entry = GLOSSARY[segment.id];
    if (!entry) {
      return (
        <Link
          key={index}
          to="/frontend/design-system/components/$slug"
          params={{ slug: segment.id }}
          className="text-foreground decoration-muted-foreground/70 hover:decoration-foreground font-medium underline underline-offset-4 transition-colors"
        >
          {segment.label}
        </Link>
      );
    }
    return (
      <GlossaryTerm
        key={index}
        id={segment.id}
        term={entry.term}
        korean={entry.korean}
        definition={entry.definition}
      >
        {segment.label}
      </GlossaryTerm>
    );
  });
}
