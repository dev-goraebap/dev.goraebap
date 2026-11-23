import { useState, useSyncExternalStore } from "react";
import { Button } from "@goraebap/ui-react/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@goraebap/ui-react/components/tabs";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { detectAngularLanguage } from "../lib/highlight";
import { CodeView } from "./CodeView";

type AdapterTarget = "react" | "angular" | "recipe";

interface AdapterCodePanelProps {
  reactCode: string;
  angularCode: string;
  recipeCode?: string;
}

const ADAPTERS: { id: AdapterTarget; label: string }[] = [
  { id: "react", label: "React" },
  { id: "angular", label: "Angular" },
  { id: "recipe", label: "Recipe" },
];
const ADAPTER_STORAGE_KEY = "goraebap-design-adapter";
const COLLAPSED_LINE_LIMIT = 10;

const adapterListeners = new Set<() => void>();

function subscribeAdapter(listener: () => void) {
  adapterListeners.add(listener);
  return () => {
    adapterListeners.delete(listener);
  };
}

function readAdapter(): AdapterTarget {
  const saved = window.localStorage.getItem(ADAPTER_STORAGE_KEY);
  return saved === "angular" || saved === "recipe" ? saved : "react";
}

function selectAdapter(adapter: AdapterTarget) {
  window.localStorage.setItem(ADAPTER_STORAGE_KEY, adapter);
  adapterListeners.forEach((listener) => listener());
}

export function AdapterCodePanel({ reactCode, angularCode, recipeCode }: AdapterCodePanelProps) {
  // 한 페이지의 여러 예제가 같은 프레임워크 코드를 보여 주도록 선택을 공유한다.
  const selectedAdapter = useSyncExternalStore(
    subscribeAdapter,
    readAdapter,
    () => "react" as const,
  );
  const adapter = selectedAdapter === "recipe" && !recipeCode ? "react" : selectedAdapter;
  const adapters = ADAPTERS.filter((item) => item.id !== "recipe" || recipeCode);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const activeCode =
    adapter === "react" ? reactCode : adapter === "angular" ? angularCode : (recipeCode ?? "");
  const activeLang =
    adapter === "react"
      ? "tsx"
      : adapter === "angular"
        ? detectAngularLanguage(angularCode)
        : "typescript";
  const isCollapsible = activeCode.split("\n").length > COLLAPSED_LINE_LIMIT;
  const isCollapsed = isCollapsible && !expanded;

  async function handleCopy() {
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Tabs
      value={adapter}
      onValueChange={(value) => selectAdapter(value as AdapterTarget)}
      className="border-border border-t"
    >
      <div className="border-border flex h-11 items-center justify-between gap-3 border-b px-4">
        <TabsList
          aria-label="어댑터 선택"
          className="h-full gap-4 rounded-none border-0 bg-transparent p-0"
        >
          {adapters.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className="text-muted-foreground hover:text-foreground data-[active]:border-foreground h-full rounded-none border-b-2 border-transparent px-0.5 pt-0.5 pb-0 data-[active]:bg-transparent data-[active]:shadow-none"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground h-7 gap-1.5 px-2 text-xs"
        >
          <SystemIcon name={copied ? "check" : "copy"} className="size-3.5" />
          <span>{copied ? "복사됨" : "복사"}</span>
        </Button>
      </div>

      {adapters.map((item) => (
        <TabsContent key={item.id} value={item.id} className="bg-background relative mt-0">
          <div
            data-lenis-prevent={isCollapsed ? undefined : true}
            className={isCollapsed ? "max-h-56 overflow-hidden" : "max-h-[32rem] overflow-auto"}
          >
            <CodeView
              code={activeCode}
              language={activeLang}
              className={`text-foreground w-max min-w-full p-5 font-mono text-xs leading-relaxed ${
                isCollapsible ? "pb-14" : ""
              }`}
            />
          </div>
          {isCollapsible && (
            <div
              className={`pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3 ${
                isCollapsed
                  ? "from-background via-background/85 bg-gradient-to-t to-transparent pt-14"
                  : ""
              }`}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                shape="pill"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
                className="bg-card pointer-events-auto h-7 gap-1 px-3 text-xs"
              >
                <span>{expanded ? "코드 접기" : "코드 펼치기"}</span>
                <SystemIcon
                  name="chevronDown"
                  className={`size-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </Button>
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
