import { cn } from "@goraebap/design-system/cn";

export function LayoutSlot({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "bg-hatch border-border text-muted-foreground flex [min-height:calc(18px/var(--layout-scale,1))] min-w-0 items-center justify-center [border-radius:calc(8px/var(--layout-scale,1))] [border-width:calc(1px/var(--layout-scale,1))] border-dashed font-mono [font-size:calc(11px/var(--layout-scale,1))] group-data-[thumb]/layout:min-h-0",
        className,
      )}
    >
      <span className="bg-background truncate [border-radius:calc(4px/var(--layout-scale,1))] [padding:calc(2px/var(--layout-scale,1))_calc(6px/var(--layout-scale,1))] group-data-[thumb]/layout:hidden">
        {label}
      </span>
    </div>
  );
}
