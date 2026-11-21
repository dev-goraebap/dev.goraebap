import type { MDXComponents } from "mdx/types";
import { Button } from "@goraebap/ui/components/button";
import { CopyCommand } from "@/components/copy-command";
import { LivePreview } from "@/components/live-preview";

export const mdxComponents: MDXComponents = {
  h2: (props) => (
    <h2 className="mt-10 mb-4 text-lg font-semibold tracking-tight first:mt-0" {...props} />
  ),
  h3: (props) => <h3 className="mt-8 mb-3 text-base font-semibold tracking-tight" {...props} />,
  p: (props) => <p className="text-foreground/90 my-4 text-base leading-[1.75]" {...props} />,
  ul: (props) => (
    <ul
      className="text-foreground/90 my-4 list-disc space-y-1.5 pl-6 text-base leading-[1.75]"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="text-foreground/90 my-4 list-decimal space-y-1.5 pl-6 text-base leading-[1.75]"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-blog-accent text-muted-foreground my-6 border-l-2 pl-4 text-[15px] leading-7 italic"
      {...props}
    />
  ),
  pre: (props) => (
    <pre
      className="border-border bg-secondary/50 text-foreground my-6 overflow-x-auto rounded-lg border p-4 font-mono text-xs leading-6"
      {...props}
    />
  ),
  code: (props) => {
    const isBlock = Boolean(props.className?.includes("language-"));
    if (isBlock) {
      return <code {...props} />;
    }
    return (
      <code
        className="bg-secondary text-foreground rounded px-1.5 py-0.5 font-mono text-[0.85em]"
        {...props}
      />
    );
  },
  a: (props) => (
    <a
      className="text-blog-accent font-medium underline underline-offset-4 hover:opacity-80"
      {...props}
    />
  ),
  hr: () => <hr className="border-border my-10" />,
  table: (props) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-border text-foreground border-b px-3 py-2 text-left text-xs font-semibold"
      {...props}
    />
  ),
  td: (props) => (
    <td className="border-border/70 text-foreground/90 border-b px-3 py-2" {...props} />
  ),
  // Live components usable directly inside MDX posts
  Button,
  CopyCommand,
  LivePreview,
};
