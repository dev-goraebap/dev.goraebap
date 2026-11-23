import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@goraebap/ui-react/components/popover";
import { SystemIcon } from "@goraebap/ui-react/icons";

interface GlossaryTermProps {
  id: string;
  term: string;
  korean?: string;
  definition: string;
  children: ReactNode;
}

export function GlossaryTerm({ id, term, korean, definition, children }: GlossaryTermProps) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={120}
        closeDelay={120}
        className="text-foreground decoration-muted-foreground/70 hover:decoration-foreground focus-visible:outline-ring cursor-help rounded-xs font-medium underline decoration-dotted underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {children}
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64">
        <PopoverTitle>{korean ?? term}</PopoverTitle>
        {korean && <p className="text-muted-foreground mt-0.5 text-[11px]">{term}</p>}
        <PopoverDescription className="break-keep">{definition}</PopoverDescription>
        <Link
          to="/glossary"
          hash={id}
          className="text-muted-foreground hover:text-foreground mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium transition-colors"
        >
          용어집에서 보기
          <SystemIcon name="arrowRight" className="size-3" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
