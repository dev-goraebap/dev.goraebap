import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  useMemo,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@goraebap/ui-react/components/table";
import { CopyCodeBlock, GlossaryTerm, MermaidDiagram } from "@/shared/ui";
import {
  resolveBackendHref,
  type BackendContentModule,
  type BackendDoc,
} from "../model/content";
import { annotateBackendPlain, BACKEND_GLOSSARY_BY_ID } from "../model/glossary";

function codeOf(node: ReactNode) {
  const code = Children.toArray(node).find(isValidElement) as
    | ReactElement<{ className?: string; children?: ReactNode }>
    | undefined;
  const text = Children.toArray(code?.props.children ?? node).join("");
  const language = /language-(\S+)/.exec(code?.props.className ?? "")?.[1];
  return { code: text.replace(/\n$/, ""), language };
}

function Pre({ children }: { children?: ReactNode }) {
  const { code, language } = codeOf(children);
  if (language === "mermaid") return <MermaidDiagram code={code} caption="다이어그램" />;
  return <CopyCodeBlock code={code} language={language} />;
}

const toAnchor = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");

const textOf = (node: ReactNode): string =>
  Children.toArray(node)
    .map((child) =>
      typeof child === "string" || typeof child === "number"
        ? String(child)
        : isValidElement<{ children?: ReactNode }>(child)
          ? textOf(child.props.children)
          : "",
    )
    .join("");

const COMPONENTS = {
  h2: ({ children }: ComponentProps<"h2">) => (
    <h2
      id={toAnchor(textOf(children))}
      className="scroll-mt-24 pt-2 text-xl font-semibold tracking-tight"
    >
      {children}
    </h2>
  ),
  h3: ({ children }: ComponentProps<"h3">) => (
    <h3
      id={toAnchor(textOf(children))}
      className="scroll-mt-24 text-lg font-semibold tracking-tight"
    >
      {children}
    </h3>
  ),
  p: (props: ComponentProps<"p">) => (
    <p className="text-foreground/90 text-base leading-7" {...props} />
  ),
  ul: (props: ComponentProps<"ul">) => (
    <ul className="text-foreground/90 list-disc space-y-2 pl-5 text-base leading-7" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="text-foreground/90 list-decimal space-y-2 pl-5 text-base leading-7" {...props} />
  ),
  li: (props: ComponentProps<"li">) => <li {...props} />,
  code: (props: ComponentProps<"code">) => (
    <code className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]" {...props} />
  ),
  pre: Pre,
  table: ({ children }: ComponentProps<"table">) => (
    <div className="border-border overflow-x-auto rounded-lg border">
      <Table>{children}</Table>
    </div>
  ),
  thead: ({ children }: ComponentProps<"thead">) => <TableHeader>{children}</TableHeader>,
  tbody: ({ children }: ComponentProps<"tbody">) => <TableBody>{children}</TableBody>,
  tr: ({ children }: ComponentProps<"tr">) => <TableRow>{children}</TableRow>,
  th: ({ children }: ComponentProps<"th">) => <TableHead>{children}</TableHead>,
  td: ({ children }: ComponentProps<"td">) => (
    <TableCell className="text-sm whitespace-normal">{children}</TableCell>
  ),
  a: ({ href, children }: ComponentProps<"a">) =>
    href?.startsWith("/") ? (
      <Link to={href} className="font-medium underline underline-offset-4">
        {children}
      </Link>
    ) : (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-medium underline underline-offset-4"
      >
        {children}
      </a>
    ),
};

type NodeProps = { children?: ReactNode; href?: string };
const GLOSSED = new Set<unknown>([COMPONENTS.p, COMPONENTS.li, COMPONENTS.td, COMPONENTS.th]);
const CODE = new Set<unknown>([COMPONENTS.code, COMPONENTS.pre]);

const treeOf = (module: BackendContentModule) =>
  (module.default as unknown as (props: { components: object }) => ReactElement<NodeProps>)({
    components: COMPONENTS,
  });

function glossed(text: string, seen: Set<string>) {
  return annotateBackendPlain(text, seen).map((segment, index) => {
    if (typeof segment === "string") return segment;
    const entry = BACKEND_GLOSSARY_BY_ID[segment.id];
    if (!entry) return segment.label;
    return (
      <GlossaryTerm
        key={`bg${index}`}
        id={entry.id}
        term={entry.term}
        korean={entry.korean}
        definition={entry.definition}
        distinction={entry.distinction}
        stacks={entry.stacks}
        glossaryPath="/backend/glossary"
      >
        {segment.label}
      </GlossaryTerm>
    );
  });
}

function transform(
  node: ReactNode,
  ctx: { file: string; seen: Set<string>; glossed: boolean },
): ReactNode {
  if (typeof node === "string") return ctx.glossed ? glossed(node, ctx.seen) : node;
  if (Array.isArray(node)) {
    return node.map((child, index) => {
      const next = transform(child, ctx);
      return isValidElement(next) && next.key == null
        ? cloneElement(next, { key: `bn${index}` })
        : next;
    });
  }
  if (!isValidElement<NodeProps>(node)) return node;
  if (CODE.has(node.type)) return node;

  const props: NodeProps = { ...node.props };
  if (node.type === COMPONENTS.a && props.href) {
    const resolved = resolveBackendHref(ctx.file, props.href);
    if (!resolved) return <span key={node.key ?? undefined}>{transform(props.children, ctx)}</span>;
    props.href = resolved;
  }
  const children = transform(props.children, {
    ...ctx,
    glossed: ctx.glossed || GLOSSED.has(node.type),
  });
  return createElement(node.type, node.key == null ? props : { ...props, key: node.key }, children);
}

export function BackendArticle({
  doc,
  activeStack,
  onSelectStack,
  trailing,
}: {
  doc: BackendDoc;
  activeStack: string;
  onSelectStack: (stack: string) => void;
  trailing?: ReactNode;
}) {
  const variant =
    activeStack !== "common" ? doc.stacks.find((item) => item.id === activeStack) : undefined;
  const activeModule = variant?.module ?? doc.module;
  const activeFile = variant?.file ?? doc.file;
  const activeSummary = variant?.meta.summary ?? doc.meta.summary;

  const body = useMemo(() => {
    const tree = treeOf(activeModule);
    return transform(tree.props.children, {
      file: activeFile,
      seen: new Set(),
      glossed: false,
    });
  }, [activeModule, activeFile]);

  const hasStacks = doc.stacks.length > 0;
  const tabs = hasStacks
    ? [{ id: "common", label: "공통" }, ...doc.stacks.map((s) => ({ id: s.id, label: s.label }))]
    : [];
  const currentTab = variant ? variant.id : "common";

  return (
    <article className="max-w-3xl space-y-8">
      <header className="border-border space-y-4 border-b pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{doc.meta.title ?? doc.slug}</h1>
          {activeSummary && (
            <p className="text-muted-foreground text-lg leading-relaxed break-keep">
              {activeSummary}
            </p>
          )}
        </div>
        {hasStacks && (
          <div
            role="tablist"
            aria-label="문서 기준 선택"
            className="bg-muted/60 inline-flex flex-wrap gap-1 rounded-full p-1"
          >
            {tabs.map((tab) => {
              const selected = tab.id === currentTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => onSelectStack(tab.id)}
                  className={
                    selected
                      ? "bg-background text-foreground cursor-pointer rounded-full px-3.5 py-1 text-sm font-medium shadow-sm transition-colors"
                      : "text-muted-foreground hover:text-foreground cursor-pointer rounded-full px-3.5 py-1 text-sm transition-colors"
                  }
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </header>
      <div className="space-y-5">{body}</div>
      {trailing}
    </article>
  );
}
