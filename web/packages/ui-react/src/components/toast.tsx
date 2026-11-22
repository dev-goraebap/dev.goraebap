import { Toast as BaseToast } from "@base-ui/react/toast";
import { cn } from "@goraebap/design-system/cn";
import {
  toastCloseVariants,
  toastRootVariants,
  toastViewportVariants,
  type ToastRootRecipeProps,
} from "@goraebap/design-system/recipes/toast";
import { SystemIcon } from "../icons";
import type { ReactNode } from "react";

export const useToastManager = BaseToast.useToastManager;
export const createToastManager = BaseToast.createToastManager;

function ToastList() {
  const { toasts } = BaseToast.useToastManager();
  return (
    <BaseToast.Portal>
      <BaseToast.Viewport className={toastViewportVariants()}>
        {toasts.map((toast) => {
          const variant = (toast.type as ToastRootRecipeProps["variant"]) ?? "default";
          return (
            <BaseToast.Root
              key={toast.id}
              toast={toast}
              className={cn(toastRootVariants({ variant }))}
            >
              <div className="space-y-0.5">
                {toast.title && (
                  <BaseToast.Title className="text-sm font-medium">{toast.title}</BaseToast.Title>
                )}
                {toast.description && (
                  <BaseToast.Description className="text-muted-foreground text-xs leading-relaxed">
                    {toast.description}
                  </BaseToast.Description>
                )}
              </div>
              <BaseToast.Close aria-label="닫기" className={toastCloseVariants()}>
                <SystemIcon name="close" className="size-3.5" />
              </BaseToast.Close>
            </BaseToast.Root>
          );
        })}
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <BaseToast.Provider>
      {children}
      <ToastList />
    </BaseToast.Provider>
  );
}
