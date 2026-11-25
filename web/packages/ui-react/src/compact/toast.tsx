"use client";

import { compactToastSlots } from "@goraebap/design-system/recipes/toast";

import * as React from "react";
import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { mergeClassName } from "../lib/utils";
import { usePortalContainer } from "../lib/portal-container";

import { Button } from "./button";
import { SystemIcon } from "../icons";

const styles = compactToastSlots();

/**
 * 토스트를 띄우는 곳. `data: { countdown: true }`를 주면 닫히기까지 남은 시간(timeout)을 줄어드는 막대로 보이고,
 * 포인터가 올라가거나 초점이 들어와 닫힘이 멈춘 동안 막대도 멈춘다(되돌리기 토스트).
 */
const toast = ToastPrimitive.createToastManager<ToastData>();

type ToastData = { countdown?: boolean };

/** 남은 시간 막대. Base UI는 목록이 펼쳐진 동안(data-expanded: 가리킴 · 초점) 닫힘을 멈추므로 막대도 그동안 멈춘다. */
function ToastCountdown({ timeout }: { timeout: number }) {
  return (
    <span
      aria-hidden="true"
      data-slot="toast-countdown"
      style={{ animationDuration: `${timeout}ms` }}
      className={styles.toastCountdown()}
    />
  );
}

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  const container = usePortalContainer();
  return (
    <ToastPrimitive.Portal
      container={container}
      data-slot="toast-portal"
      {...props}
    />
  );
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={mergeClassName(
        // 대화상자 · 시트(z-50)와 그 흐린 바탕보다 위에 뜬다: 대화상자 안에서 한 일의 결과도 가려지지 않게.
        styles.toastViewport(),
        className,
      )}
      {...props}
    />
  );
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={mergeClassName(styles.toast(), className)}
      {...props}
    />
  );
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={mergeClassName(styles.toastContent(), className)}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={mergeClassName(styles.toastTitle(), className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={mergeClassName(styles.toastDescription(), className)}
      {...props}
    />
  );
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={mergeClassName(styles.toastAction(), className)}
      {...props}
    />
  );
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="닫기"
      render={render}
      className={mergeClassName(styles.toastClose(), className)}
      {...props}
    >
      {children ?? <SystemIcon name="close" aria-hidden="true" />}
    </ToastPrimitive.Close>
  );
}

function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode = null;

  if (type === "success") {
    icon = <SystemIcon name="success" aria-hidden="true" />;
  }

  if (type === "info") {
    icon = <SystemIcon name="info" aria-hidden="true" />;
  }

  if (type === "warning") {
    icon = <SystemIcon name="warning" aria-hidden="true" />;
  }

  if (type === "error") {
    icon = (
      <SystemIcon
        name="error"
        className={styles.errorIcon()}
        aria-hidden="true"
      />
    );
  }

  if (type === "loading") {
    icon = (
      <SystemIcon
        name="loading"
        className={styles.loadingIcon()}
        aria-hidden="true"
      />
    );
  }

  if (!icon) {
    return null;
  }

  return (
    <span data-slot="toast-icon" className={styles.toastIcon()}>
      {icon}
    </span>
  );
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent
        className={
          toastItem.data?.countdown ? styles.countdownContent() : undefined
        }
      >
        <ToastIcon type={toastItem.type} />
        <div className={styles.toastListdiv()}>
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
        {toastItem.data?.countdown && toastItem.timeout ? (
          <ToastCountdown timeout={toastItem.timeout} />
        ) : null}
      </ToastContent>
    </Toast>
  ));
}

function Toaster({
  children,
  toastManager = toast,
  ...props
}: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  );
}

const createToastManager = ToastPrimitive.createToastManager;
const useToastManager = ToastPrimitive.useToastManager;

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
};
