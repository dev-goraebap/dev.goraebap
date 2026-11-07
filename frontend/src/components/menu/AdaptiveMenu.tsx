import { useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "@astryxdesign/core/Button";
import {
  DropdownMenu as DesktopMenu,
  type DropdownMenuOption,
} from "@astryxdesign/core/DropdownMenu";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { List, ListItem } from "@astryxdesign/core/List";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import { Icon } from "../../foundations/Icon";
export type MenuChoice = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  isDisabled?: boolean;
  group?: string;
};
/** 선택 값과 동작은 같은 데이터를 쓰고, 화면 폭에 맞춰 메뉴와 시트로 전환한다. */
export function AdaptiveMenu({
  button,
  items,
  hasChevron = true,
  placement = "below",
  active = false,
}: {
  button: Omit<ButtonProps, "onClick">;
  items: MenuChoice[];
  hasChevron?: boolean;
  placement?: "above" | "below";
  active?: boolean;
}) {
  const phone = useMediaQuery("(width < 64rem)");
  const [open, setOpen] = useState(false);
  const trigger = {
    ...button,
    size: button.size ?? (phone ? ("sm" as const) : ("md" as const)),
    variant: button.isIconOnly
      ? active
        ? ("view-active" as const)
        : ("tool" as const)
      : button.variant,
  };
  const groups: { title?: string; items: MenuChoice[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (!last || last.title !== item.group)
      groups.push({ title: item.group, items: [item] });
    else last.items.push(item);
  }
  const convert = (item: MenuChoice) => ({
    label: item.label,
    icon: item.icon,
    isDisabled: item.isDisabled,
    endContent: item.selected ? <Icon name="check" /> : undefined,
    onClick: item.onClick,
  });
  const desktop: DropdownMenuOption[] = groups.flatMap<DropdownMenuOption>(
    (group) =>
      group.title
        ? [
            {
              type: "section",
              title: group.title,
              items: group.items.map(convert),
            },
          ]
        : group.items.map(convert),
  );
  if (!phone)
    return (
      <span className="library-tool-trigger" data-active={active || undefined}>
        <DesktopMenu
          button={trigger}
          hasChevron={hasChevron}
          placement={placement}
          items={desktop}
        />
      </span>
    );
  return (
    <span className="library-tool-trigger" data-active={active || undefined}>
      <Button
        {...trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      />
      <BottomSheet
        label={button.label}
        isOpen={open}
        onOpenChange={setOpen}
        height="hug"
      >
        <div className="library-menu-sheet">
          <header>
            <h2>{button.label}</h2>
            <Button
              label="닫기"
              isIconOnly
              size="sm"
              icon={<Icon name="x" />}
              variant="ghost"
              onClick={() => setOpen(false)}
            />
          </header>
          {groups.map((group, index) => (
            <List
              key={index}
              density="balanced"
              header={group.title ? <h3>{group.title}</h3> : undefined}
            >
              {group.items.map((item) => (
                <ListItem
                  key={item.label}
                  className="library-menu-choice"
                  label={item.label}
                  startContent={item.icon}
                  endContent={item.selected ? <Icon name="check" /> : undefined}
                  isSelected={item.selected}
                  isDisabled={item.isDisabled}
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                />
              ))}
            </List>
          ))}
        </div>
      </BottomSheet>
    </span>
  );
}
