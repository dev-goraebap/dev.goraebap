import { useRef, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "../../../foundations/Icon";
import { useToolSize } from "../../../foundations/use-tool-size";
/** 닫기는 검색 조건을 보존한다. 지우기와 접기를 별도 동작으로 둔다. */
export function SearchTool({
  value,
  onChange,
  label = "검색",
  inputLabel = label,
  placeholder = "검색…",
}: {
  label?: string;
  inputLabel?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const size = useToolSize();
  const [open, setOpen] = useState(!!value);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  if (!open)
    return (
      <span className="library-tool-trigger" data-active={!!value || undefined}>
        <Button
          size={size}
          ref={trigger}
          label={label}
          tooltip={value ? "검색 중" : "검색"}
          isIconOnly
          icon={<Icon name="search" selected={!!value} size={16} />}
          variant={value ? "view-active" : "tool"}
          onClick={() => setOpen(true)}
        />
      </span>
    );
  return (
    <div className="library-search">
      <Icon name="search" size={16} />
      <input
        aria-label={inputLabel}
        placeholder={placeholder}
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            close();
          }
        }}
      />
      {value && (
        <Button
          size={size}
          label="검색어 지우기"
          isIconOnly
          variant="ghost"
          icon={<Icon name="close" size={16} />}
          onClick={() => onChange("")}
        />
      )}
      <Button
        size={size}
        label="검색 닫기"
        isIconOnly
        variant="ghost"
        icon={<Icon name="x" size={16} />}
        onClick={close}
      />
    </div>
  );
}
