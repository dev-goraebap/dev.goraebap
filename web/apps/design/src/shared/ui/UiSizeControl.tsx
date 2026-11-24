import { ToggleGroup, ToggleGroupItem } from "@goraebap/ui-react/components/toggle-group";
import { UI_SIZE_OPTIONS, useDesignConfig, type UiSizeId } from "../lib/design-config";

export function UiSizeControl() {
  const { config, updateConfig } = useDesignConfig();

  return (
    <ToggleGroup
      aria-label="화면 크기"
      value={[config.uiSize]}
      onValueChange={(next) => {
        if (next[0]) updateConfig("uiSize", next[0] as UiSizeId);
      }}
      className="grid w-full grid-cols-4"
    >
      {UI_SIZE_OPTIONS.map((option) => (
        <ToggleGroupItem key={option.id} value={option.id} size="sm" className="w-full px-0">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
