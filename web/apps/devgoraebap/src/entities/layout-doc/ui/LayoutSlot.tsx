import { cn } from "@goraebap/design-system/cn";

export function LayoutSlot({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "bg-hatch border-border text-muted-foreground flex [min-height:calc(1.125rem/var(--layout-scale,1))] min-w-0 items-center justify-center [border-radius:calc(8px/var(--layout-scale,1))] [border-width:calc(1px/var(--layout-scale,1))] border-dashed font-mono [font-size:calc(0.6875rem/var(--layout-scale,1))] group-data-[thumb]/layout:min-h-0",
        className,
      )}
    >
      <span className="bg-background truncate [border-radius:calc(4px/var(--layout-scale,1))] [padding:calc(0.125rem/var(--layout-scale,1))_calc(0.375rem/var(--layout-scale,1))] group-data-[thumb]/layout:hidden">
        {label}
      </span>
    </div>
  );
}
