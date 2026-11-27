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
  distinction?: string;
  stacks?: Record<string, string>;
  glossaryPath?: "/frontend/glossary" | "/backend/glossary";
  children: ReactNode;
}

export function GlossaryTerm({
  id,
  term,
  korean,
  definition,
  distinction,
  stacks,
  glossaryPath = "/frontend/glossary",
  children,
}: GlossaryTermProps) {
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
      <PopoverContent side="top" className="w-72 space-y-2">
        <div>
          <PopoverTitle>{korean ?? term}</PopoverTitle>
          {korean && <p className="text-muted-foreground mt-0.5 text-[0.6875rem]">{term}</p>}
        </div>
        <PopoverDescription className="break-keep">{definition}</PopoverDescription>
        {distinction && (
          <p className="text-muted-foreground border-border border-t pt-2 text-xs leading-relaxed break-keep">
            {distinction}
          </p>
        )}
        {stacks && Object.keys(stacks).length > 0 && (
          <dl className="bg-muted/50 space-y-1 rounded-lg px-2.5 py-2 text-[0.6875rem]">
            {Object.entries(stacks).map(([name, mapping]) => (
              <div key={name} className="flex flex-col gap-0.5">
                <dt className="text-foreground font-medium">{name}</dt>
                <dd className="text-muted-foreground break-keep">{mapping}</dd>
              </div>
            ))}
          </dl>
        )}
        <Link
          to={glossaryPath}
          hash={id}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 pt-0.5 text-[0.6875rem] font-medium transition-colors"
        >
          용어집에서 보기
          <SystemIcon name="arrowRight" className="size-3" />
        </Link>
      </PopoverContent>
    </Popover>
  );
}
