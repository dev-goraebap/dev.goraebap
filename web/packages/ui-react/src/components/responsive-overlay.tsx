import { createContext, useContext, useState, type ReactElement, type ReactNode } from "react";
import { useIsMobile } from "../lib/use-is-mobile";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "./bottom-sheet";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  type PopoverContentProps,
} from "./popover";

interface ResponsiveRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

interface ResponsivePartProps {
  className?: string;
  children?: ReactNode;
}

interface ResponsiveActionProps extends ResponsivePartProps {
  render?: ReactElement;
  disabled?: boolean;
}

const SheetContext = createContext(false);

// 화면 폭이 바뀌어 내부 컴포넌트가 교체되어도 열림 상태는 이어지도록 바깥에서 들고 있는다.
function useOpenState({ open, defaultOpen = false, onOpenChange }: ResponsiveRootProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  return {
    open: open ?? internalOpen,
    onOpenChange: (next: boolean) => {
      setInternalOpen(next);
      onOpenChange?.(next);
    },
  };
}

export function ResponsiveDialog(props: ResponsiveRootProps) {
  const isSheet = useIsMobile();
  const state = useOpenState(props);
  return (
    <SheetContext value={isSheet}>
      {isSheet ? (
        <BottomSheet {...state}>{props.children}</BottomSheet>
      ) : (
        <Dialog {...state}>{props.children}</Dialog>
      )}
    </SheetContext>
  );
}

export function ResponsiveDialogTrigger(props: ResponsiveActionProps) {
  return useContext(SheetContext) ? (
    <BottomSheetTrigger {...props} />
  ) : (
    <DialogTrigger {...props} />
  );
}

export function ResponsiveDialogClose(props: ResponsiveActionProps) {
  return useContext(SheetContext) ? <BottomSheetClose {...props} /> : <DialogClose {...props} />;
}

export function ResponsiveDialogContent(props: ResponsivePartProps) {
  return useContext(SheetContext) ? (
    <BottomSheetContent {...props} />
  ) : (
    <DialogContent {...props} />
  );
}

export function ResponsiveDialogTitle(props: ResponsivePartProps) {
  return useContext(SheetContext) ? <BottomSheetTitle {...props} /> : <DialogTitle {...props} />;
}

export function ResponsiveDialogDescription(props: ResponsivePartProps) {
  return useContext(SheetContext) ? (
    <BottomSheetDescription {...props} />
  ) : (
    <DialogDescription {...props} />
  );
}

export function ResponsivePopover({
  mobile = "sheet",
  ...props
}: ResponsiveRootProps & { mobile?: "sheet" | "popover" }) {
  const isMobile = useIsMobile();
  const isSheet = isMobile && mobile === "sheet";
  const state = useOpenState(props);
  return (
    <SheetContext value={isSheet}>
      {isSheet ? (
        <BottomSheet {...state}>{props.children}</BottomSheet>
      ) : (
        <Popover {...state}>{props.children}</Popover>
      )}
    </SheetContext>
  );
}

export function ResponsivePopoverTrigger(props: ResponsiveActionProps) {
  return useContext(SheetContext) ? (
    <BottomSheetTrigger {...props} />
  ) : (
    <PopoverTrigger {...props} />
  );
}

export function ResponsivePopoverClose(props: ResponsiveActionProps) {
  return useContext(SheetContext) ? <BottomSheetClose {...props} /> : <PopoverClose {...props} />;
}

export function ResponsivePopoverContent({
  side,
  align,
  sideOffset,
  ...props
}: ResponsivePartProps & Pick<PopoverContentProps, "side" | "align" | "sideOffset">) {
  return useContext(SheetContext) ? (
    <BottomSheetContent {...props} />
  ) : (
    <PopoverContent side={side} align={align} sideOffset={sideOffset} {...props} />
  );
}

export function ResponsivePopoverTitle(props: ResponsivePartProps) {
  return useContext(SheetContext) ? <BottomSheetTitle {...props} /> : <PopoverTitle {...props} />;
}

export function ResponsivePopoverDescription(props: ResponsivePartProps) {
  return useContext(SheetContext) ? (
    <BottomSheetDescription {...props} />
  ) : (
    <PopoverDescription {...props} />
  );
}
