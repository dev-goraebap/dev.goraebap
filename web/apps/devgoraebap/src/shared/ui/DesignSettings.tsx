import { useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@goraebap/ui-react/components/button";
import {
  ResponsivePopover,
  ResponsivePopoverContent,
  ResponsivePopoverTitle,
  ResponsivePopoverTrigger,
} from "@goraebap/ui-react/components/responsive-overlay";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@goraebap/ui-react/components/select";
import { ToggleGroup, ToggleGroupItem } from "@goraebap/ui-react/components/toggle-group";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { useIsMobile } from "@goraebap/ui-react/lib/use-is-mobile";
import {
  CORNER_SHAPE_OPTIONS,
  FONT_OPTIONS,
  HEADING_OPTIONS,
  ICON_SET_OPTIONS,
  LATIN_FONT_OPTIONS,
  RADIUS_OPTIONS,
  THEME_PRESETS,
  useDesignConfig,
  type DesignConfig,
} from "../lib/design-config";
import { UiSizeControl } from "./UiSizeControl";

function SettingRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground text-xs font-medium">{label}</span>
        {value && <span className="text-foreground text-xs font-medium">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function CornerGlyph({ radius, shape }: { radius: string; shape: string }) {
  return (
    <span
      aria-hidden="true"
      className="block size-5 border-t-2 border-l-2 border-current"
      style={{ borderTopLeftRadius: radius, cornerShape: shape } as CSSProperties}
    />
  );
}

function SettingSelect<K extends "font" | "heading" | "latinFont">({
  label,
  configKey,
  options,
}: {
  label: string;
  configKey: K;
  options: { id: DesignConfig[K]; label: string }[];
}) {
  const { config, updateConfig } = useDesignConfig();
  return (
    <SettingRow label={label}>
      <Select
        value={config[configKey]}
        items={options.map((option) => ({ value: option.id, label: option.label }))}
        onValueChange={(value) => {
          if (value) updateConfig(configKey, value as DesignConfig[K]);
        }}
      >
        <SelectTrigger size="sm" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingRow>
  );
}

const supportsSquircle = CSS.supports("corner-shape", "squircle");

export function DesignSettings() {
  const { config, rootScale, updateConfig, resetConfig } = useDesignConfig();
  const isMobile = useIsMobile();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const activePreset = THEME_PRESETS.find((preset) => preset.id === config.theme);

  function selectMode(next: boolean) {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("goraebap-design-mode", next ? "dark" : "light");
  }

  return (
    <ResponsivePopover>
      <ResponsivePopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            shape="pill"
            aria-label="디자인 설정"
            className="bg-secondary/60 text-muted-foreground hover:text-foreground size-8"
          />
        }
      >
        <SystemIcon name="palette" className="size-4" />
      </ResponsivePopoverTrigger>
      <ResponsivePopoverContent
        align="end"
        data-lenis-prevent
        className={isMobile ? undefined : "max-h-[var(--available-height)] w-80 overflow-y-auto"}
      >
        <div className="flex items-center justify-between gap-2 pr-7 lg:pr-0">
          <ResponsivePopoverTitle>디자인 설정</ResponsivePopoverTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetConfig}
            className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
          >
            <SystemIcon name="reset" className="size-3.5" />
            <span>초기화</span>
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          <SettingRow label="화면 모드">
            <ToggleGroup
              aria-label="화면 모드"
              value={[dark ? "dark" : "light"]}
              onValueChange={(next) => {
                if (next[0]) selectMode(next[0] === "dark");
              }}
              className="grid w-full grid-cols-2"
            >
              <ToggleGroupItem value="light" size="sm" className="w-full">
                <SystemIcon name="sun" />
                라이트
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" size="sm" className="w-full">
                <SystemIcon name="moon" />
                다크
              </ToggleGroupItem>
            </ToggleGroup>
          </SettingRow>

          <SettingRow label="화면 크기" value={`${Math.round(16 * rootScale)}px`}>
            <UiSizeControl />
          </SettingRow>

          <SettingRow label="색상 테마" value={activePreset?.name}>
            <div
              role="radiogroup"
              aria-label="색상 테마"
              className="grid grid-cols-5 gap-2.5 p-0.5"
            >
              {THEME_PRESETS.map((preset) => {
                const isSelected = config.theme === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={preset.name}
                    title={preset.name}
                    onClick={() => updateConfig("theme", preset.id)}
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${preset.swatches[2]} 6%, ${preset.swatches[0]} 36%, ${preset.swatches[3]} 100%)`,
                    }}
                    className={`focus-visible:outline-ring ring-offset-popover aspect-square w-full cursor-pointer rounded-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      isSelected
                        ? "ring-foreground ring-2 ring-offset-2"
                        : "ring-foreground/15 hover:ring-foreground/40 ring-1"
                    }`}
                  />
                );
              })}
            </div>
          </SettingRow>

          <SettingRow label="라운드">
            <ToggleGroup
              aria-label="라운드"
              value={[config.radius]}
              onValueChange={(next) => {
                if (next[0]) updateConfig("radius", next[0] as DesignConfig["radius"]);
              }}
              className="grid w-full grid-cols-5"
            >
              {RADIUS_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option.id}
                  value={option.id}
                  size="sm"
                  aria-label={`라운드 ${option.label}`}
                  className="h-auto w-full flex-col gap-1.5 px-0 py-2"
                >
                  <CornerGlyph radius={option.id} shape={config.cornerShape} />
                  <span className="text-[0.6875rem] tabular-nums">{option.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </SettingRow>

          <SettingRow label="모서리 곡선">
            <ToggleGroup
              aria-label="모서리 곡선"
              value={[config.cornerShape]}
              onValueChange={(next) => {
                if (next[0]) updateConfig("cornerShape", next[0] as DesignConfig["cornerShape"]);
              }}
              className="grid w-full grid-cols-2"
            >
              {CORNER_SHAPE_OPTIONS.map((option) => (
                <ToggleGroupItem
                  key={option.id}
                  value={option.id}
                  size="sm"
                  disabled={option.id === "squircle" && !supportsSquircle}
                  title={
                    option.id === "squircle" && !supportsSquircle
                      ? "이 브라우저는 초타원 곡선을 지원하지 않습니다"
                      : undefined
                  }
                  className="h-9 w-full gap-2"
                >
                  <CornerGlyph radius="1rem" shape={option.id} />
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </SettingRow>

          <div className="grid grid-cols-2 gap-3">
            <SettingSelect label="본문 폰트" configKey="font" options={FONT_OPTIONS} />
            <SettingSelect label="제목 폰트" configKey="heading" options={HEADING_OPTIONS} />
          </div>

          <SettingSelect label="영문 폰트" configKey="latinFont" options={LATIN_FONT_OPTIONS} />

          <SettingRow label="아이콘">
            <ToggleGroup
              aria-label="아이콘"
              value={[config.iconSet]}
              onValueChange={(next) => {
                if (next[0]) updateConfig("iconSet", next[0] as DesignConfig["iconSet"]);
              }}
              className="grid w-full grid-cols-2"
            >
              {ICON_SET_OPTIONS.map((option) => (
                <ToggleGroupItem key={option.id} value={option.id} size="sm" className="w-full">
                  <SystemIcon name="sun" iconSet={option.id} />
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </SettingRow>
        </div>
      </ResponsivePopoverContent>
    </ResponsivePopover>
  );
}
