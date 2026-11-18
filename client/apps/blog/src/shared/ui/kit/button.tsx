import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { createContext, useContext, type ReactNode } from "react"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
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
        link: "rounded-none text-primary underline-offset-4 hover:underline",
        /** 뷰 · 탭 알약. 지금 뷰는 view-active(두 단계 밝은 면, 진한 글자). */
        view: "border-control-border bg-control text-muted-foreground hover:bg-control-hover hover:text-foreground",
        "view-active": "border-control-border bg-control-on text-foreground",
        /** 필터 · 표시 · 검색 같은 동그란 도구: 조작 면의 흐린 아이콘. 켜지면(aria-pressed · aria-expanded) 두 단계 밝다. */
        tool: "border-control-border bg-control text-muted-foreground hover:bg-control-hover hover:text-foreground aria-expanded:bg-control-on aria-expanded:text-foreground aria-pressed:bg-control-on aria-pressed:text-foreground",
        /** 만들기: 기본 단추에 굵은 글자. */
        create: "bg-primary font-semibold text-primary-foreground hover:bg-primary/85",
      },
      size: {
        default:
          "h-9 md:h-7 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-9 md:size-7",
        "icon-xs":
          "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>
type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>

/**
 * 한 묶음 안의 단추 모양(칸 머리의 둥근 도구 줄, 휴대폰 앱 바의 알약). 묶음이 단추를 하위 선택자로 덮어쓰지 않고 이 값으로
 * 정한다: 변형을 바꾸는 규칙(예: ghost → tool), 크기, 마지막에 붙일 클래스. 포털(팝오버 · 시트 · 대화상자)은 이 값을 끊는다.
 */
export type ButtonStyle = { variant?: (variant: ButtonVariant) => ButtonVariant; size?: ButtonSize; className?: string }

const ButtonStyleContext = createContext<ButtonStyle | null>(null)

/** 안의 단추들(Button)의 모양을 정한다. */
export function ButtonStyleProvider({ value, children }: { value: ButtonStyle | null; children: ReactNode }) {
  return <ButtonStyleContext value={value}>{children}</ButtonStyleContext>
}

/** 포털로 뜨는 것(메뉴 · 시트 · 대화상자)의 단추는 연 자리의 묶음 모양을 따르지 않는다. */
export function ButtonStyleReset({ children }: { children: ReactNode }) {
  return <ButtonStyleContext value={null}>{children}</ButtonStyleContext>
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const group = useContext(ButtonStyleContext)
  const shown = group?.variant?.(variant ?? "default") ?? variant
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={shown}
      className={cn(buttonVariants({ variant: shown, size: group?.size ?? size }), className, group?.className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
