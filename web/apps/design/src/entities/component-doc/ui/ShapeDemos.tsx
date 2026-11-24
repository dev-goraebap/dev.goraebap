import { type ReactNode } from "react";
import { Avatar, AvatarFallback } from "@goraebap/ui-react/components/avatar";
import { Progress } from "@goraebap/ui-react/components/progress";
import { Slider } from "@goraebap/ui-react/components/slider";
import { Switch } from "@goraebap/ui-react/components/switch";

const SHAPES = ["default", "pill"] as const;
type Shape = (typeof SHAPES)[number];

function ShapeRow({ render }: { render: (shape: Shape) => ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-md gap-6 py-4 sm:grid-cols-2">
      {SHAPES.map((shape) => (
        <div key={shape} data-shape={shape} className="flex min-w-0 flex-col items-center gap-3">
          <div className="flex min-h-10 w-full items-center justify-center">{render(shape)}</div>
          <span className="text-muted-foreground font-mono text-[0.6875rem]">{shape}</span>
        </div>
      ))}
    </div>
  );
}

export function ReactAvatarShapeDemo() {
  return (
    <ShapeRow
      render={(shape) => (
        <Avatar shape={shape}>
          <AvatarFallback>고래</AvatarFallback>
        </Avatar>
      )}
    />
  );
}

export function ReactSwitchShapeDemo() {
  return (
    <ShapeRow
      render={(shape) => <Switch shape={shape} defaultChecked aria-label={`${shape} 스위치`} />}
    />
  );
}

export function ReactSliderShapeDemo() {
  return (
    <ShapeRow
      render={(shape) => (
        <Slider shape={shape} defaultValue={60} aria-label={`${shape} 슬라이더`} />
      )}
    />
  );
}

export function ReactProgressShapeDemo() {
  return (
    <ShapeRow
      render={(shape) => <Progress shape={shape} value={68} aria-label={`${shape} 진행률`} />}
    />
  );
}
