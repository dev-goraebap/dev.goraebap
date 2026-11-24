import { useMemo } from "react";
import { GLOSSARY, annotateGlossary, type GlossarySegment } from "@/shared/lib/glossary";
import { GlossaryTerm } from "./GlossaryTerm";

// 한 페이지의 글을 순서대로 받아, 용어마다 처음 나온 곳만 용어집에 잇는다.
export function useGlossaryText(texts: string[]) {
  return useMemo(() => {
    const result = annotateGlossary(texts.map((text, index) => [String(index), text]));
    return texts.map((_, index) => result[String(index)]);
  }, [texts]);
}

export function GlossaryText({ segments }: { segments: GlossarySegment[] }) {
  return segments.map((segment, index) => {
    if (typeof segment === "string") return segment;
    const entry = GLOSSARY[segment.id];
    if (!entry) return segment.label;
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

// 페이지에 직접 쓴 문단 하나를 용어집에 잇는다. 같은 문단 안에서는 처음 나온 곳만 잇는다.
export function Glossed({ children }: { children: string }) {
  const [segments] = useGlossaryText([children]);
  return <GlossaryText segments={segments} />;
}
