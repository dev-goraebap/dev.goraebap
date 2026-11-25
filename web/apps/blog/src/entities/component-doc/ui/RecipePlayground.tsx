import { useState, type ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@goraebap/ui-react/components/select";
import { Switch } from "@goraebap/ui-react/components/switch";
import { useDesignConfig } from "@/shared/lib/design-config";
import { AdapterCodePanel, ThemedPortalScope } from "@/shared/ui";
import { CLASS_GROUPS, classColor, classGroup } from "../lib/recipe-classes";
import { getRecipeAxes, getRecipeParts, type RecipePart } from "../lib/recipe-parts";
import type { ComponentDemoSpec } from "../model/catalog";
import type { PlaygroundConfig, PlaygroundFlag, PlaygroundState } from "../model/playgrounds";
import { ContainerPreview } from "./ContainerPreview";

const FLAG_LABELS: Record<PlaygroundFlag, string> = {
  disabled: "disabled",
  readOnly: "readOnly",
  loading: "loading",
  fullWidth: "full width",
};

const isBooleanAxis = (options: string[]) =>
  options.length === 2 && options.includes("true") && options.includes("false");

const toTokens = (classes: string) => classes.split(/\s+/).filter(Boolean);

function classesOf(part: RecipePart | undefined, { selection, flags }: PlaygroundState) {
  if (!part) return [];
  const props: Record<string, string | undefined> = {};
  for (const axis of Object.keys(part.recipe.variants ?? {})) props[axis] = selection[axis];
  if (flags.fullWidth) props.className = "w-full";
  return toTokens(part.recipe(props));
}

function PropertyRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-9 grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3">
      <span className="text-muted-foreground font-mono text-xs">{label}</span>
      {children}
    </div>
  );
}

function PropertySelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <PropertyRow label={label}>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
      >
        <SelectTrigger size="sm" aria-label={label} className="w-full font-mono">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option} className="font-mono">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PropertyRow>
  );
}

function PropertySwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <PropertyRow label={label}>
      <Switch
        aria-label={label}
        checked={checked}
        onCheckedChange={onChange}
        className="justify-self-end"
      />
    </PropertyRow>
  );
}

// 레시피 클래스 목록과 그 목록을 고르는 part 선택. 지금은 화면에 보이지 않게 꺼 두고, 다시 쓸 때 true로 켠다.
const SHOW_CLASSES = false;

export function RecipePlayground({
  slug,
  doc,
  config,
  recipeCode,
}: {
  slug: string;
  doc: ComponentDemoSpec;
  config?: PlaygroundConfig;
  recipeCode?: string;
}) {
  const { config: designConfig } = useDesignConfig();
  const [parts] = useState(() =>
    getRecipeParts(slug).filter((part) =>
      toTokens(part.recipe({})).some((token) => classGroup(token) !== null),
    ),
  );
  const axes = config ? getRecipeAxes(parts) : [];
  const [partName, setPartName] = useState(parts[0]?.name ?? "");
  const [state, setState] = useState<PlaygroundState>(() => ({
    selection: Object.fromEntries(axes.map((axis) => [axis.name, axis.defaultValue])),
    flags: { disabled: false, readOnly: false, loading: false, fullWidth: false },
  }));
  const [changed, setChanged] = useState({ revision: 0, tokens: new Set<string>() });
  const { selection, flags } = state;
  const part = parts.find((item) => item.name === partName);

  const tokens = classesOf(part, state);
  const overrides = axes.filter((axis) => selection[axis.name] !== axis.defaultValue);
  const attributes = [
    ...overrides.map(({ name }) =>
      selection[name] === "true" ? ` ${name}` : ` ${name}="${selection[name]}"`,
    ),
    flags.fullWidth ? ' className="w-full"' : "",
    flags.loading ? " loading" : "",
    flags.disabled ? " disabled" : "",
    flags.readOnly ? " readOnly" : "",
  ].join("");
  const recipeEntries = [
    ...overrides
      .filter(({ name }) => selection[name] !== "false")
      .map(({ name }) =>
        selection[name] === "true" ? `${name}: true` : `${name}: '${selection[name]}'`,
      ),
    ...overrides
      .filter(({ name }) => selection[name] === "false")
      .map(({ name }) => `${name}: false`),
    ...(flags.fullWidth ? ["className: 'w-full'"] : []),
  ];
  const recipeArguments = recipeEntries.length ? `{ ${recipeEntries.join(", ")} }` : "";

  function update(next: PlaygroundState) {
    const current = new Set(tokens);
    setState(next);
    setChanged({
      revision: changed.revision + 1,
      tokens: new Set(classesOf(part, next).filter((token) => !current.has(token))),
    });
  }

  const selectAxes = axes.filter((axis) => !isBooleanAxis(axis.options));
  const booleanAxes = axes.filter((axis) => isBooleanAxis(axis.options));
  const configFlags = config?.flags ?? [];
  const hasToggles = booleanAxes.length + configFlags.length > 0;
  const hasPartSelect = SHOW_CLASSES && parts.length > 1;
  const hasProperties = hasPartSelect || selectAxes.length > 0 || hasToggles;
  const preview = config ? config.render(state) : doc.renderReactDemo();

  return (
    <ThemedPortalScope theme={designConfig.theme}>
      <section
        aria-label="레시피 플레이그라운드"
        className="border-border bg-card overflow-hidden rounded-2xl border"
      >
        <div
          className={`grid grid-cols-[minmax(0,1fr)] ${
            hasProperties ? "lg:grid-cols-[minmax(0,1fr)_18rem]" : ""
          }`}
        >
          <div
            data-ds-theme={designConfig.theme}
            className="bg-dots bg-background/70 text-foreground flex min-h-72 min-w-0 items-center justify-center p-5 transition-colors sm:p-8"
          >
            {config?.fillsContainer || flags.fullWidth ? (
              <ContainerPreview>{preview}</ContainerPreview>
            ) : config ? (
              preview
            ) : (
              <div className="w-full max-w-2xl">{preview}</div>
            )}
          </div>

          {hasProperties && (
            <div className="border-border space-y-1 border-t p-4 lg:border-t-0 lg:border-l">
              {hasPartSelect && (
                <>
                  <PropertySelect
                    label="part"
                    value={partName}
                    options={parts.map((item) => item.name)}
                    onChange={(next) => {
                      setPartName(next);
                      setChanged({ revision: changed.revision + 1, tokens: new Set() });
                    }}
                  />
                  {(selectAxes.length > 0 || hasToggles) && (
                    <div className="border-border my-2 border-t" />
                  )}
                </>
              )}
              {selectAxes.map((axis) => (
                <PropertySelect
                  key={axis.name}
                  label={axis.name}
                  value={selection[axis.name]}
                  options={axis.options}
                  onChange={(value) =>
                    update({ ...state, selection: { ...selection, [axis.name]: value } })
                  }
                />
              ))}
              {selectAxes.length > 0 && hasToggles && (
                <div className="border-border my-2 border-t" />
              )}
              {booleanAxes.map((axis) => (
                <PropertySwitch
                  key={axis.name}
                  label={axis.name}
                  checked={selection[axis.name] === "true"}
                  onChange={(checked) =>
                    update({
                      ...state,
                      selection: { ...selection, [axis.name]: String(checked) },
                    })
                  }
                />
              ))}
              {configFlags.map((flag) => (
                <PropertySwitch
                  key={flag}
                  label={FLAG_LABELS[flag]}
                  checked={flags[flag]}
                  onChange={(checked) => update({ ...state, flags: { ...flags, [flag]: checked } })}
                />
              ))}
            </div>
          )}
        </div>

        {SHOW_CLASSES && (
          <dl className="border-border divide-border divide-y border-t">
            {CLASS_GROUPS.map((group) => {
              const groupTokens = tokens.filter((token) => classGroup(token) === group);
              if (groupTokens.length === 0) return null;
              return (
                <div
                  key={group}
                  className="grid gap-2 px-5 py-3 sm:grid-cols-[6.5rem_1fr] sm:gap-4"
                >
                  <dt className="text-muted-foreground pt-0.5 text-xs font-medium">{group}</dt>
                  <dd className="flex min-w-0 flex-wrap gap-1.5">
                    {groupTokens.map((token) => {
                      const isChanged = changed.tokens.has(token);
                      const color = classColor(token);
                      return (
                        <code
                          key={`${token}-${isChanged ? changed.revision : 0}`}
                          data-changed={isChanged ? "" : undefined}
                          className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-[0.6875rem] break-all ${
                            isChanged
                              ? "border-info/50 bg-info/10 text-foreground animate-in fade-in zoom-in-95 duration-200 motion-reduce:animate-none"
                              : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          {color && (
                            <span
                              aria-hidden="true"
                              data-ds-theme={designConfig.theme}
                              className="ring-foreground/20 size-2.5 shrink-0 rounded-[3px] ring-1"
                              style={{ background: color }}
                            />
                          )}
                          {token}
                        </code>
                      );
                    })}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}

        {/* 고른 옵션을 반영한 코드. 옵션이 없는 컴포넌트의 코드는 문서의 스택 글에 있다. */}
        {config && (
          <AdapterCodePanel
            reactCode={config.reactCode(attributes, state)}
            angularCode={config.angularCode(recipeArguments, state)}
            recipeCode={recipeCode}
          />
        )}
      </section>
    </ThemedPortalScope>
  );
}
