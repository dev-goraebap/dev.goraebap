import { tv, type VariantProps } from "tailwind-variants";

const controlVariants = {
  link: "rounded-none text-primary underline-offset-4 hover:underline",
  view: "border-control-border bg-control text-muted-foreground hover:bg-control-hover hover:text-foreground",
  "view-active": "border-control-border bg-control-on text-foreground",
  tool: "border-control-border bg-control text-muted-foreground hover:bg-control-hover hover:text-foreground aria-expanded:bg-control-on aria-expanded:text-foreground aria-pressed:bg-control-on aria-pressed:text-foreground",
  create:
    "bg-primary font-semibold text-primary-foreground hover:bg-primary/85",
};

const compactSizes = {
  compact:
    "h-9 md:h-7 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
  "compact-sm":
    "h-7 gap-1 px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
  "compact-lg":
    "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
  "compact-icon": "size-9 md:size-7",
  xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
  "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
  "icon-sm": "size-7",
  "icon-lg": "size-9",
};

export const buttonVariants = tv({
  base: "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 data-[loading]:cursor-wait data-[loading]:opacity-80 data-[loading]:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  variants: {
    variant: {
      ...controlVariants,
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline:
        "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    },
    size: {
      ...compactSizes,
      default: "h-9 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-10 px-6",
      icon: "size-9",
    },
    shape: {
      default: "rounded-md",
      pill: "rounded-full",
    },
  },
  compoundVariants: [
    { variant: ["tool", "view", "view-active"], class: "border" },
    {
      variant: ["tool", "view", "view-active", "create"],
      shape: "default",
      class: "rounded-full",
    },
    { variant: "link", shape: "default", class: "rounded-none" },
  ],
  defaultVariants: {
    variant: "default",
    size: "default",
    shape: "default",
  },
});

export const buttonSpinnerVariants = tv({
  base: "shrink-0 animate-spin motion-reduce:animate-[spin_2s_linear_infinite]",
});

export type ButtonRecipeProps = VariantProps<typeof buttonVariants>;

export const compactButtonVariants = tv({
  base: "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/85",
      /** 바탕보다 살짝 밝은 면과 가는 테두리(조작 면). 도구 · 보기 탭 · 속성 알약과 같은 면이다. */
      secondary:
        "border-control-border bg-control text-foreground hover:bg-control-hover aria-expanded:bg-control-hover",
      /** 테두리만: 면 없이 가는 테두리, 가리키면 조작 면. */
      outline:
        "border-control-border bg-transparent text-foreground hover:bg-control aria-expanded:bg-control",
      ghost:
        "hover:bg-control-hover hover:text-foreground aria-expanded:bg-control-hover aria-expanded:text-foreground",
      destructive:
        "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
      ...controlVariants,
    },
    size: {
      default: compactSizes["compact"],
      xs: compactSizes["xs"],
      sm: compactSizes["compact-sm"],
      lg: compactSizes["compact-lg"],
      icon: compactSizes["compact-icon"],
      "icon-xs": compactSizes["icon-xs"],
      "icon-sm": compactSizes["icon-sm"],
      "icon-lg": compactSizes["icon-lg"],
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type CompactButtonRecipeProps = VariantProps<
  typeof compactButtonVariants
>;
