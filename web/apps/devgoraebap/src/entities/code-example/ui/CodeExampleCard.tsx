import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui-react/components/tabs";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { CopyCodeBlock } from "@/shared/ui";
import { STACK_LABELS, type CodeExample, type ExampleBlock } from "../model/examples";

function Blocks({ blocks }: { blocks: ExampleBlock[] }) {
  // 코드 블록 머리에는 바로 앞 출처의 파일 이름을 붙인다.
  let label = "";
  return blocks.map((block, index) => {
    if (block.kind === "source") {
      label = block.label.split("/").pop() ?? block.label;
      return (
        <a
          key={index}
          href={block.href}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground flex min-w-0 items-center gap-1.5 font-mono text-xs transition-colors"
        >
          <SystemIcon name="file" className="size-3.5 shrink-0" />
          <span className="truncate">{block.label}</span>
        </a>
      );
    }
    if (block.kind === "code") {
      return (
        <CopyCodeBlock key={index} label={label} language={block.language} code={block.code} />
      );
    }
    return (
      <p key={index} className="text-foreground/90 text-sm leading-6">
        {block.text}
      </p>
    );
  });
}

// 예시 하나를 스택 탭으로 보인다. 스택이 하나면 탭 없이 그 스택 이름만 붙인다.
export function CodeExampleCard({ example }: { example: CodeExample }) {
  const [first] = example.stacks;
  return (
    <section className="bg-card space-y-4 rounded-2xl border p-5">
      <header className="space-y-1.5">
        <h3 className="text-base font-semibold tracking-tight">{example.title}</h3>
        <p className="text-muted-foreground text-sm leading-6">{example.intro}</p>
      </header>
      {example.stacks.length > 1 ? (
        <Tabs defaultValue={first.id}>
          <TabsList>
            {example.stacks.map((stack) => (
              <TabsTrigger key={stack.id} value={stack.id}>
                {STACK_LABELS[stack.id] ?? stack.id}
              </TabsTrigger>
            ))}
          </TabsList>
          {example.stacks.map((stack) => (
            <TabsContent key={stack.id} value={stack.id} className="space-y-3 pt-2">
              <Blocks blocks={stack.blocks} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        first && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium">
              {STACK_LABELS[first.id] ?? first.id}
            </p>
            <Blocks blocks={first.blocks} />
          </div>
        )
      )}
    </section>
  );
}

// 사이트 문서가 옮긴 지침을 링크한 예시를 모아 문서 끝에 둔다.
export function CodeExampleList({ examples }: { examples: CodeExample[] }) {
  if (examples.length === 0) return null;
  return (
    <section className="border-border space-y-4 border-t pt-8">
      <h2 className="text-xl font-semibold tracking-tight">코드 예시</h2>
      {examples.map((example) => (
        <CodeExampleCard key={example.path} example={example} />
      ))}
    </section>
  );
}
