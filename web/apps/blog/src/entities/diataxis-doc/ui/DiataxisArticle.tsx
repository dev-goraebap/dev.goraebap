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
import {
  CopyCodeBlock,
  FileTreeView,
  GlossaryTerm,
  LayersDiagram,
  MaturityMeta,
  MermaidDiagram,
  MobileToc,
  TableOfContents,
  extractHeadingsFromMarkdown,
  headingToAnchor,
} from "@/shared/ui";
import { annotateDomainPlain, glossaryForDomain } from "@/shared/lib/glossary";
import {
  resolveDiataxisHref,
  type DiataxisContentModule,
  type DiataxisDoc,
  type DiataxisSpace,
} from "../model/content";

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
  if (language === "mermaid") return <MermaidDiagram code={code} />;
  if (language === "tree") return <FileTreeView code={code} />;
  if (language === "layers") return <LayersDiagram code={code} />;
  return <CopyCodeBlock code={code} language={language} />;
}

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
      id={headingToAnchor(textOf(children))}
      className="scroll-mt-24 pt-2 text-xl font-semibold tracking-tight"
    >
      {children}
    </h2>
  ),
  h3: ({ children }: ComponentProps<"h3">) => (
    <h3
      id={headingToAnchor(textOf(children))}
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

const treeOf = (module: DiataxisContentModule) =>
  (module.default as unknown as (props: { components: object }) => ReactElement<NodeProps>)({
    components: COMPONENTS,
  });

function glossed(space: DiataxisSpace, text: string, seen: Set<string>) {
  const { byId } = glossaryForDomain(space);
  return annotateDomainPlain(space, text, seen).map((segment, index) => {
    if (typeof segment === "string") return segment;
    const entry = byId[segment.id];
    if (!entry) return segment.label;
    return (
      <GlossaryTerm
        key={`dg${index}`}
        id={entry.id}
        term={entry.term}
        korean={entry.korean}
        domainLabel={entry.domainLabel}
        definition={entry.definition}
        distinction={entry.distinction}
        stacks={entry.stacks}
      >
        {segment.label}
      </GlossaryTerm>
    );
  });
}

function transform(
  node: ReactNode,
  ctx: { space: DiataxisSpace; file: string; seen: Set<string>; glossed: boolean },
): ReactNode {
  if (typeof node === "string") return ctx.glossed ? glossed(ctx.space, node, ctx.seen) : node;
  if (Array.isArray(node)) {
    return node.map((child, index) => {
      const next = transform(child, ctx);
      return isValidElement(next) && next.key == null
        ? cloneElement(next, { key: `dn${index}` })
        : next;
    });
  }
  if (!isValidElement<NodeProps>(node)) return node;
  if (CODE.has(node.type)) return node;

  const props: NodeProps = { ...node.props };
  if (node.type === COMPONENTS.a && props.href) {
    const resolved = resolveDiataxisHref(ctx.file, props.href);
    if (!resolved) return <span key={node.key ?? undefined}>{transform(props.children, ctx)}</span>;
    props.href = resolved;
  }
  const children = transform(props.children, {
    ...ctx,
    glossed: ctx.glossed || GLOSSED.has(node.type),
  });
  return createElement(node.type, node.key == null ? props : { ...props, key: node.key }, children);
}

export function DiataxisArticle({
  doc,
  activeStack,
  onSelectStack,
  trailing,
}: {
  doc: DiataxisDoc;
  activeStack: string;
  onSelectStack: (stack: string) => void;
  trailing?: ReactNode;
}) {
  const variant =
    activeStack !== "common" ? doc.stacks.find((item) => item.id === activeStack) : undefined;
  const activeModule = variant?.module ?? doc.module;
  const activeFile = variant?.file ?? doc.file;
  const activeSource = variant?.source ?? doc.source;
  const activeSummary = variant?.meta.summary ?? doc.meta.summary;

  const headings = useMemo(() => extractHeadingsFromMarkdown(activeSource), [activeSource]);

  const body = useMemo(() => {
    const tree = treeOf(activeModule);
    return transform(tree.props.children, {
      space: doc.space,
      file: activeFile,
      seen: new Set(),
      glossed: false,
    });
  }, [activeModule, activeFile, doc.space]);

  const hasStacks = doc.stacks.length > 0;
  const tabs = hasStacks
    ? [{ id: "common", label: "공통" }, ...doc.stacks.map((s) => ({ id: s.id, label: s.label }))]
    : [];
  const currentTab = variant ? variant.id : "common";
  const showAside = hasStacks || headings.length > 0;

  return (
    <div className="flex items-start gap-10">
      <article className="min-w-0 flex-1 max-w-3xl space-y-8">
        <header className="border-border space-y-4 border-b pb-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{doc.meta.title ?? doc.slug}</h1>
            {activeSummary && (
              <p className="text-muted-foreground text-lg leading-relaxed break-keep">
                {activeSummary}
              </p>
            )}
            <MaturityMeta primary={variant?.meta} fallback={doc.meta} />
          </div>
          {hasStacks && (
            <div
              role="tablist"
              aria-label="문서 기준 선택"
              className="bg-muted/60 inline-flex flex-wrap gap-1 rounded-full p-1 xl:hidden"
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

        <MobileToc items={headings} />

        {doc.meta.thumbnail && (
          <div className="corner-squircle overflow-hidden rounded-[22px]">
            <img
              src={doc.meta.thumbnail}
              alt={doc.meta.title ?? doc.slug}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        <div className="space-y-5">{body}</div>
        {trailing}
      </article>

      {showAside && (
        <aside
          aria-label="문서 탐색"
          className="hidden w-52 shrink-0 xl:sticky xl:top-[calc(3.5rem+2.5rem)] xl:block"
        >
          <div className="max-h-[calc(100dvh-7rem)] space-y-7 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {hasStacks && (
              <section aria-label="문서 기준 선택" className="space-y-2.5">
                <p className="text-muted-foreground text-xs font-semibold">기준</p>
                <div
                  role="tablist"
                  aria-orientation="vertical"
                  className="border-border flex flex-col border-l text-[0.8125rem] leading-snug"
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
                        className={`cursor-pointer py-1.5 pl-3 text-left transition-colors ${
                          selected
                            ? "border-foreground text-foreground -ml-px border-l-2 font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
            <TableOfContents items={headings} />
          </div>
        </aside>
      )}
    </div>
  );
}
