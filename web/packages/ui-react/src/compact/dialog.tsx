import { compactDialogSlots } from "@goraebap/design-system/recipes/dialog";
import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn, mergeClassName } from "../lib/utils";
import { usePortalContainer } from "../lib/portal-container";

import { Button, ButtonStyleReset } from "./button";
import { SystemIcon } from "../icons";

const styles = compactDialogSlots();

type Size = { width: number; height: number };

/**
 * 대화상자를 같은 자리에서 바꿔 끼울 때 isSwapped로 새 진입 애니메이션을 생략한다.
 * 중첩 대화상자는 별도로 열리므로 이 설정을 물려받지 않는다.
 */
type DialogPanelState = { isSwapped: boolean };
const DialogPanelContext = React.createContext<DialogPanelState | null>(null);

function DialogPanel({
  isSwapped,
  children,
}: {
  isSwapped: boolean;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ isSwapped }), [isSwapped]);
  return (
    <DialogPanelContext.Provider value={value}>
      {children}
    </DialogPanelContext.Provider>
  );
}

const SIZE_MOTION: KeyframeAnimationOptions = {
  duration: 200,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
};

/**
 * 같은 대화상자 안에서 내용이 바뀌어(단계 넘김 등) 크기가 달라지면 앞 크기에서 새 크기로 움직여 간다(height: auto는 CSS transition이
 * 걸리지 않는다). 다른 대화상자로 바꿔 끼우는 전환은 호출자가 맡는다.
 * 크기는 transform(여는 확대)을 빼고 잰다. 움직이는 동안의 크기 변화는 그 움직임의 것이라 건너뛴다. 움직임을 줄이는 설정이면 바로 바뀐다.
 */
function useSizeTransition(element: HTMLDivElement | null) {
  React.useLayoutEffect(() => {
    if (!element) return;
    let last: Size | undefined;
    let motion: Animation | undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new ResizeObserver(() => {
      if (motion) return;
      const next = { width: element.offsetWidth, height: element.offsetHeight };
      const moved =
        last &&
        (Math.abs(last.height - next.height) > 1 ||
          Math.abs(last.width - next.width) > 1);
      if (!moved || reduced.matches) {
        last = next;
        return;
      }
      element.dataset.resizing = "";
      motion = element.animate(
        [
          {
            width: `${last!.width}px`,
            height: `${last!.height}px`,
            overflow: "hidden",
          },
          {
            width: `${next.width}px`,
            height: `${next.height}px`,
            overflow: "hidden",
          },
        ],
        SIZE_MOTION,
      );
      const settle = () => {
        motion = undefined;
        delete element.dataset.resizing;
        last = { width: element.offsetWidth, height: element.offsetHeight };
      };
      motion.onfinish = settle;
      motion.oncancel = settle;
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      motion?.cancel();
      delete element.dataset.resizing;
    };
  }, [element]);
}

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  const container = usePortalContainer();
  return (
    <DialogPrimitive.Portal
      container={container}
      data-slot="dialog-portal"
      {...props}
    />
  );
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  const isHandedOff = !!React.useContext(DialogPanelContext)?.isSwapped;
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={mergeClassName(
        cn(styles.dialogOverlay(), !isHandedOff && styles.overlayEnter()),
        className,
      )}
      {...props}
    />
  );
}

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (value: T | null) => {
    for (const each of refs) {
      if (typeof each === "function") each(value);
      else if (each) (each as React.RefObject<T | null>).current = value;
    }
  };
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ref,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  const panel = React.useContext(DialogPanelContext);
  const from = panel?.isSwapped;
  // 팝업은 포털이 붙은 뒤에 생기므로 ref 객체가 아니라 상태로 받아, 생긴 때 크기 재기를 건다.
  const [element, setElement] = React.useState<HTMLDivElement | null>(null);
  const popupRef = React.useMemo(
    () => mergeRefs<HTMLDivElement>(setElement, ref),
    [ref],
  );
  useSizeTransition(element);
  return (
    <DialogPortal>
      <ButtonStyleReset>
        <DialogOverlay />
        <DialogPrimitive.Popup
          ref={popupRef}
          data-slot="dialog-content"
          data-panel={panel ? "" : undefined}
          className={mergeClassName(
            cn(styles.dialogContent(), !from && styles.contentEnter()),
            className,
          )}
          {...props}
        >
          <DialogPanelContext.Provider value={null}>
            {children}
          </DialogPanelContext.Provider>
          {showCloseButton && (
            <DialogPrimitive.Close
              data-slot="dialog-close"
              render={
                <Button
                  variant="ghost"
                  className={styles.closeButton()}
                  size="icon-sm"
                />
              }
            >
              <SystemIcon name="close" />
              <span className={styles.closeLabel()}>닫기</span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Popup>
      </ButtonStyleReset>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={mergeClassName(styles.dialogHeader(), className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={mergeClassName(styles.dialogFooter(), className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          닫기
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={mergeClassName(styles.dialogTitle(), className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={mergeClassName(styles.dialogDescription(), className)}
      {...props}
    />
  );
}

/**
 * 머리를 직접 꾸리는 대화상자의 머리 줄(목록 위 상세 · 양식 · 프로필): 앞(놓일 곳 칩), 이름, 그 뒤 도구 · 크게 보기 · 닫기.
 * 기본 닫기 단추(showCloseButton)를 끄고 쓴다.
 */
function DialogBar({
  title,
  before,
  onExpand,
  children,
}: {
  title: React.ReactNode;
  before?: React.ReactNode;
  onExpand?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div data-slot="dialog-bar" className={styles.dialogBar()}>
      {before}
      <DialogTitle className={styles.barTitle()}>{title}</DialogTitle>
      <div className={styles.barActions()}>
        {children}
        {/* 페이지로 열기(↗): 주소가 그 페이지로 바뀌므로 크게 보기(⤢, 같은 주소의 ?focus=1)와 다른 아이콘이다(2026-11-15). */}
        {onExpand && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="페이지로 열기"
            title="페이지로 열기"
            onClick={onExpand}
          >
            <SystemIcon name="externalLink" />
          </Button>
        )}
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="닫기"
              title="닫기"
            />
          }
        >
          <SystemIcon name="close" />
        </DialogClose>
      </div>
    </div>
  );
}

const DialogBodyContext = React.createContext(false);

/**
 * 대화상자 본문 안인가. 본문은 대화상자가 여백 · 폭을 이미 정했으므로, 페이지에서 쓰던 가운데 단 · 여백 · 바탕을 두지 않고
 * 대화상자 폭을 그대로 쓴다(상세 · 관리 화면의 단).
 */
const useIsInDialogBody = () => React.useContext(DialogBodyContext);

/**
 * 대화상자의 스크롤하는 내용: 대화상자 폭을 끝까지 써서 스크롤 막대가 오른쪽 끝에 붙고, 위아래 끝은 구분선 대신 서서히 사라진다.
 * 대화상자가 자라거나 줄어드는 동안(data-resizing)은 스크롤하지 않는다: 그 사이 내용이 잠깐 넘쳐 막대가 생겼다 사라지며 내용이 좌우로
 * 흔들리지 않게. 막대 자리를 늘 비워 두는 방법(scrollbar-gutter)은 오른쪽 여백만 좁아져 머리의 닫기와 선이 어긋나 쓰지 않는다.
 */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <DialogBodyContext value>
      <div
        data-slot="dialog-body"
        className={mergeClassName(styles.dialogBody(), className)}
        {...props}
      />
    </DialogBodyContext>
  );
}

export {
  Dialog,
  DialogBar,
  DialogBody,
  useIsInDialogBody,
  DialogClose,
  DialogContent,
  DialogPanel,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
