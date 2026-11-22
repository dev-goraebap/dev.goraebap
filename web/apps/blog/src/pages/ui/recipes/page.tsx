import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { alertVariants, type AlertRecipeProps } from "@goraebap/design-system/recipes/alert";
import { badgeVariants, type BadgeRecipeProps } from "@goraebap/design-system/recipes/badge";
import { buttonVariants, type ButtonRecipeProps } from "@goraebap/design-system/recipes/button";
import { Badge } from "@goraebap/ui/components/badge";

export const Route = createFileRoute("/ui/recipes/")({
  component: UiRecipesPage,
});

const BTN_VARIANTS: Array<NonNullable<ButtonRecipeProps["variant"]>> = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
];
const BTN_SIZES: Array<NonNullable<ButtonRecipeProps["size"]>> = ["sm", "default", "lg"];
const BADGE_VARIANTS: Array<NonNullable<BadgeRecipeProps["variant"]>> = [
  "default",
  "secondary",
  "outline",
  "muted",
  "destructive",
];
const ALERT_VARIANTS: Array<NonNullable<AlertRecipeProps["variant"]>> = [
  "default",
  "info",
  "success",
  "warning",
  "destructive",
];

function UiRecipesPage() {
  const [btnVariant, setBtnVariant] =
    useState<NonNullable<ButtonRecipeProps["variant"]>>("default");
  const [btnSize, setBtnSize] = useState<NonNullable<ButtonRecipeProps["size"]>>("default");
  const [badgeVariant, setBadgeVariant] =
    useState<NonNullable<BadgeRecipeProps["variant"]>>("secondary");
  const [alertVariant, setAlertVariant] =
    useState<NonNullable<AlertRecipeProps["variant"]>>("info");

  const btnClasses = buttonVariants({ variant: btnVariant, size: btnSize });
  const badgeClasses = badgeVariants({ variant: badgeVariant });
  const alertClasses = alertVariants({ variant: alertVariant });

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Badge variant="outline">LAYER 02 · STYLE RECIPES</Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Style Recipes (CVA)</h1>
        <p className="text-muted-foreground text-sm">
          프레임워크 의존성이 0%인 순수 TypeScript 함수입니다. React와 Angular 모두 같은 함수를
          호출해 동일한 Tailwind 클래스 문자열을 얻습니다.
        </p>
      </div>

      <section className="border-border bg-card overflow-hidden rounded-xl border">
        <div className="bg-dots flex min-h-32 items-center justify-center p-6">
          <button type="button" className={btnClasses}>
            buttonVariants({btnVariant}, {btnSize})
          </button>
        </div>
        <div className="border-border bg-secondary/30 space-y-3 border-t p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {BTN_VARIANTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setBtnVariant(v)}
                  className={
                    btnVariant === v
                      ? "bg-primary text-primary-foreground cursor-pointer rounded px-2 py-0.5 font-mono text-[11px]"
                      : "border-border bg-background text-muted-foreground cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px]"
                  }
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {BTN_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setBtnSize(s)}
                  className={
                    btnSize === s
                      ? "bg-primary text-primary-foreground cursor-pointer rounded px-2 py-0.5 font-mono text-[11px]"
                      : "border-border bg-background text-muted-foreground cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px]"
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <pre className="border-border bg-background text-muted-foreground overflow-x-auto rounded border p-3 font-mono text-[11px] whitespace-pre-wrap">
            {btnClasses}
          </pre>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="border-border bg-card space-y-4 rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">badgeVariants</h2>
            <span className={badgeClasses}>{badgeVariant}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BADGE_VARIANTS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBadgeVariant(v)}
                className={
                  badgeVariant === v
                    ? "bg-primary text-primary-foreground cursor-pointer rounded px-2 py-0.5 font-mono text-[11px]"
                    : "border-border bg-background text-muted-foreground cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px]"
                }
              >
                {v}
              </button>
            ))}
          </div>
          <pre className="border-border bg-background text-muted-foreground rounded border p-2.5 font-mono text-[10px] whitespace-pre-wrap">
            {badgeClasses}
          </pre>
        </section>

        <section className="border-border bg-card space-y-4 rounded-xl border p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">alertVariants</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALERT_VARIANTS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAlertVariant(v)}
                className={
                  alertVariant === v
                    ? "bg-primary text-primary-foreground cursor-pointer rounded px-2 py-0.5 font-mono text-[11px]"
                    : "border-border bg-background text-muted-foreground cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px]"
                }
              >
                {v}
              </button>
            ))}
          </div>
          <div className={alertClasses}>
            <h5>상태 알림 ({alertVariant})</h5>
            <p>동일한 레시피로 React와 Angular 알림 상자를 칠합니다.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
