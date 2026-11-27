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
import { Badge } from "@goraebap/ui-react/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@goraebap/ui-react/components/table";
import { annotatePlain, GLOSSARY } from "@/shared/lib/glossary";
import {
  CopyCodeBlock,
  FileTreeView,
  GlossaryTerm,
  LayersDiagram,
  MermaidDiagram,
} from "@/shared/ui";
import { STACK_LABELS, type ContentDoc, type ContentModule } from "../model/content";
import { resolveHref, type SkillHref } from "../model/link";

// 공통 글의 <Slot name>을 스택 파일의 <Fill name>이 채운다. 둘 다 표시일 뿐 그리지 않고, 렌더 전에 요소 트리에서 바꿔 끼운다. 스택 파일이 없거나 그 자리를 채우지 않으면 비워 둔다.
function Slot() {
  return null;
}
function Fill() {
  return null;
}

// 사람에게만 보이는 글. 스킬로 빌드할 때 지운다.
function Story({ children }: { children?: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

// 움직이는 견본. 사람에게만 보이고 스킬로 빌드할 때 지운다.
function Demo({ children }: { children?: ReactNode }) {
  return <div className="bg-dots border-border rounded-2xl border p-4 sm:p-6">{children}</div>;
}

// 자동 연결 목록에 없는 용어를 용어집에 잇는 표시. 다른 뜻으로 흔히 쓰는 말(비활성, 변형 등)에 직접 단다. 스킬로 빌드할 때는 글자만 남는다.
function Term({ children }: { id: string; children?: ReactNode }) {
  return <>{children}</>;
}

function Callout({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <aside className="border-foreground/25 bg-muted/40 [&_p]:text-muted-foreground space-y-1.5 rounded-r-xl border-l-2 px-4 py-3.5 [&_p]:text-sm [&_p]:leading-6">
      {title && <p className="!text-foreground text-sm font-semibold">{title}</p>}
      {children}
    </aside>
  );
}

// 코드 블록(<pre><code class="language-x">)에서 언어와 글을 꺼낸다.
function codeOf(node: ReactNode) {
  const code = Children.toArray(node).find(isValidElement) as
    ReactElement<{ className?: string; children?: ReactNode }> | undefined;
  const text = Children.toArray(code?.props.children ?? node).join("");
  const language = /language-(\S+)/.exec(code?.props.className ?? "")?.[1];
  return { code: text.replace(/\n$/, ""), language };
}

function Pre({ children, label }: { children?: ReactNode; label?: ReactNode }) {
  const { code, language } = codeOf(children);
  if (language === "mermaid") return <MermaidDiagram code={code} />;
  if (language === "tree") return <FileTreeView code={code} />;
  if (language === "layers") return <LayersDiagram code={code} />;
  return <CopyCodeBlock code={code} language={language} label={label} />;
}

function Diagram({ caption, children }: { caption: string; children?: ReactNode }) {
  const pre = Children.toArray(children).find(isValidElement) as
    ReactElement<{ children?: ReactNode }> | undefined;
  return <MermaidDiagram code={codeOf(pre?.props.children).code} caption={caption} />;
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
  Slot,
  Fill,
  Story,
  Demo,
  Callout,
  Term,
  Diagram,
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

type Props = { children?: ReactNode; href?: string; name?: string };
const GLOSSED = new Set<unknown>([COMPONENTS.p, COMPONENTS.li, COMPONENTS.td, COMPONENTS.th]);
const CODE = new Set<unknown>([COMPONENTS.code, COMPONENTS.pre, Diagram]);

// MDX 본문을 요소 트리로 만든다. 렌더 전에 한 번에 돌아서 Strict Mode의 이중 렌더에도 결과가 같다.
const treeOf = (module: ContentModule) =>
  (module.default as unknown as (props: { components: object }) => ReactElement<Props>)({
    components: COMPONENTS,
  });

function collectFills(module: ContentModule | undefined) {
  const fills: Record<string, ReactNode> = {};
  if (!module) return fills;
  const tree = treeOf(module);
  const top = tree.type === Fill ? [tree] : Children.toArray(tree.props.children);
  for (const child of top)
    if (isValidElement<Props>(child) && child.type === Fill && child.props.name)
      fills[child.props.name] = child.props.children;
  return fills;
}

interface Context {
  file: string;
  stack: string;
  skillHref: SkillHref;
  fills: Record<string, ReactNode>;
  fillFile?: string;
  seen: Set<string>;
  glossed: boolean;
}

function glossed(text: string, seen: Set<string>) {
  return annotatePlain(text, seen).map((segment, index) => {
    if (typeof segment === "string") return segment;
    const entry = GLOSSARY[segment.id];
    return (
      <GlossaryTerm
        key={`g${index}`}
        id={segment.id}
        term={entry.term}
        korean={entry.korean}
        domainLabel={entry.domainLabel}
        definition={entry.definition}
      >
        {segment.label}
      </GlossaryTerm>
    );
  });
}

// "출처: [파일](주소)" 문단 바로 뒤의 코드 블록은 그 파일 이름을 머리에 단 코드 블록 하나로 묶는다.
function sourceLabel(node: ReactNode) {
  if (!isValidElement<Props>(node) || node.type !== COMPONENTS.p) return undefined;
  const parts = Children.toArray(node.props.children);
  if (parts.length !== 2 || parts[0] !== "출처: " || !isValidElement<Props>(parts[1]))
    return undefined;
  return parts[1];
}

function transform(node: ReactNode, ctx: Context): ReactNode {
  if (typeof node === "string") return ctx.glossed ? glossed(node, ctx.seen) : node;
  if (Array.isArray(node)) {
    const out: ReactNode[] = [];
    for (let i = 0; i < node.length; i++) {
      const label = sourceLabel(node[i]);
      const next = node[i + 1];
      if (label && isValidElement<Props>(next) && next.type === COMPONENTS.pre) {
        out.push(
          <Pre key={`src${i}`} label={transform(label, { ...ctx, glossed: false })}>
            {next.props.children}
          </Pre>,
        );
        i++;
        continue;
      }
      out.push(transform(node[i], ctx));
    }
    return out.map((child, index) =>
      isValidElement(child) && child.key == null
        ? cloneElement(child, { key: `n${index}` })
        : child,
    );
  }
  if (!isValidElement<Props>(node)) return node;

  if (node.type === Slot) {
    const fill = ctx.fills[node.props.name ?? ""];
    return fill == null ? null : transform(fill, { ...ctx, file: ctx.fillFile ?? ctx.file });
  }
  if (node.type === Fill) return null;
  if (node.type === Term) {
    const id = (node.props as { id?: string }).id ?? "";
    const entry = GLOSSARY[id];
    const label = transform(node.props.children, { ...ctx, glossed: false });
    if (!entry || ctx.seen.has(id)) return label;
    ctx.seen.add(id);
    return (
      <GlossaryTerm key={node.key ?? undefined} id={id} term={entry.term} korean={entry.korean} domainLabel={entry.domainLabel} definition={entry.definition}>
        {label}
      </GlossaryTerm>
    );
  }
  if (CODE.has(node.type)) return node;

  const props: Props = { ...node.props };
  if (node.type === COMPONENTS.a && props.href) {
    const href = resolveHref(ctx.file, props.href, ctx.stack, ctx.skillHref);
    if (!href) return <span key={node.key ?? undefined}>{transform(props.children, ctx)}</span>;
    props.href = href;
  }
  const children = transform(props.children, {
    ...ctx,
    glossed: ctx.glossed || GLOSSED.has(node.type),
  });
  return createElement(node.type, node.key == null ? props : { ...props, key: node.key }, children);
}

export function ContentArticle({
  doc,
  stack,
  skillHref,
  trailing,
}: {
  doc: ContentDoc;
  stack: string;
  skillHref: SkillHref;
  trailing?: ReactNode;
}) {
  const body = useMemo(() => {
    const stackFile = doc.stacks[stack];
    const tree = treeOf(doc.module);
    return transform(tree.props.children, {
      file: doc.file,
      stack,
      skillHref,
      fills: collectFills(stackFile?.module),
      fillFile: stackFile?.file,
      seen: new Set(),
      glossed: false,
    });
  }, [doc, stack, skillHref]);

  return (
    <article className="max-w-3xl space-y-8">
      <header className="border-border space-y-3 border-b pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{doc.meta.title}</h1>
          {doc.isSkill && <Badge variant="secondary">AI</Badge>}
          {Object.keys(doc.stacks).length > 0 && (
            <Badge variant="outline">{STACK_LABELS[stack] ?? stack}</Badge>
          )}
        </div>
        {doc.isSkill ? (
          <div className="space-y-1">
            <p className="text-muted-foreground font-mono text-sm">{doc.meta.name}</p>
            <p className="text-muted-foreground text-lg leading-relaxed">{doc.meta.description}</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-lg leading-relaxed">{doc.meta.summary}</p>
        )}
      </header>
      <div className="space-y-5">{body}</div>
      {trailing}
    </article>
  );
}
