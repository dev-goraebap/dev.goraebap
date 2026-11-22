import { useState, type CSSProperties, type ReactNode } from "react";
import { avatarFallbackVariants, avatarVariants } from "@goraebap/design-system/recipes/avatar";
import {
  progressIndicatorVariants,
  progressTrackVariants,
} from "@goraebap/design-system/recipes/progress";
import { sliderNativeVariants } from "@goraebap/design-system/recipes/slider";
import { switchThumbVariants, switchTrackVariants } from "@goraebap/design-system/recipes/switch";
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
          <span className="text-muted-foreground font-mono text-[11px]">{shape}</span>
        </div>
      ))}
    </div>
  );
}

export function NativeAvatarShapeDemo() {
  return (
    <ShapeRow
      render={(shape) => (
        <span className={avatarVariants({ shape })}>
          <span className={avatarFallbackVariants()}>고래</span>
        </span>
      )}
    />
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

function NativeShapeSwitch({ shape }: { shape: Shape }) {
  const [checked, setChecked] = useState(true);
  const state = checked ? "" : undefined;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${shape} 스위치`}
      data-checked={state}
      onClick={() => setChecked((value) => !value)}
      className={switchTrackVariants({ shape })}
    >
      <span data-checked={state} className={switchThumbVariants({ shape })} />
    </button>
  );
}

export function NativeSwitchShapeDemo() {
  return <ShapeRow render={(shape) => <NativeShapeSwitch shape={shape} />} />;
}

export function ReactSwitchShapeDemo() {
  return (
    <ShapeRow
      render={(shape) => <Switch shape={shape} defaultChecked aria-label={`${shape} 스위치`} />}
    />
  );
}

function NativeShapeSlider({ shape }: { shape: Shape }) {
  const [value, setValue] = useState(60);
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      aria-label={`${shape} 슬라이더`}
      onChange={(event) => setValue(Number(event.target.value))}
      style={{ "--slider-value": `${value}%` } as CSSProperties}
      className={sliderNativeVariants({ shape })}
    />
  );
}

export function NativeSliderShapeDemo() {
  return <ShapeRow render={(shape) => <NativeShapeSlider shape={shape} />} />;
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

export function NativeProgressShapeDemo() {
  return (
    <ShapeRow
      render={(shape) => (
        <div
          role="progressbar"
          aria-label={`${shape} 진행률`}
          aria-valuenow={68}
          aria-valuemin={0}
          aria-valuemax={100}
          className={progressTrackVariants({ shape })}
        >
          <div className={progressIndicatorVariants({ shape })} style={{ width: "68%" }} />
        </div>
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
