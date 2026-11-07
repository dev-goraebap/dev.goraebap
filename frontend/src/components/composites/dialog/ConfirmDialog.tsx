import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Button } from "@astryxdesign/core/Button";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import { ReferenceDialog } from "./ReferenceDialog";
export function ConfirmDialog({
  title,
  description,
  onCancel,
  onConfirm,
  cancelLabel = "취소",
  confirmLabel = "확인",
  isDestructive = false,
}: {
  title: string;
  cancelLabel?: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const phone = useMediaQuery("(width < 64rem)");
  const footer = (
    <div className="library-form-actions">
      <Button label={cancelLabel} variant="ghost" onClick={onCancel} />
      <Button
        label={confirmLabel}
        variant={isDestructive ? "destructive" : "primary"}
        onClick={onConfirm}
      />
    </div>
  );
  return phone ? (
    <BottomSheet
      isOpen
      label={title}
      height="hug"
      purpose="form"
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <div className="library-confirm-sheet">
        <h2>{title}</h2>
        <p>{description}</p>
        {footer}
      </div>
    </BottomSheet>
  ) : (
    <ReferenceDialog
      isOpen
      title={title}
      width="25rem"
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      footer={footer}
    >
      <p>{description}</p>
    </ReferenceDialog>
  );
}
