import { Button } from "@goraebap/ui-react/components/button";
import { ToastProvider, useToastManager } from "@goraebap/ui-react/components/toast";

function ToastTrigger({ variant }: { variant: string }) {
  const toastManager = useToastManager();
  return (
    <Button
      variant="outline"
      onClick={() =>
        toastManager.add({
          title: "설정이 저장되었습니다",
          description: "변경 사항이 즉시 반영됩니다.",
          type: variant,
        })
      }
    >
      알림 띄우기
    </Button>
  );
}

export function ToastPreview({ variant }: { variant: string }) {
  return (
    <ToastProvider>
      <ToastTrigger variant={variant} />
    </ToastProvider>
  );
}
