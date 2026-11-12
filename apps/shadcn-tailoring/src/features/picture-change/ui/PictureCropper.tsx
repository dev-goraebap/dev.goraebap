import { useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { Button } from "@/shared/ui/button"
import { MinusIcon, PlusIcon } from "@/shared/ui/icon"
import type { CropArea } from "../model/crop-picture"

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const clamp = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))

/**
 * 사진 자르개(호호코워크 PictureCropper): 원 안에 들어갈 자리를 끌고, 휠 · 두 손가락 · 확대 막대로 키운다.
 * 바텀시트 안에서 끄는 것이 시트 닫기로 읽히지 않도록 data-base-ui-swipe-ignore를 둔다.
 * 확대 막대는 shadcn Slider가 아직 없어 input range로 둔다(npx shadcn add slider로 바꿀 자리). 손가락으로 맞추기 쉽게 −/+도 둔다.
 */
export function PictureCropper({ source, isBusy, onArea }: { source: string; isBusy: boolean; onArea: (area: CropArea) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const percent = `${Math.round(zoom * 100)}%`
  return (
    <div className="flex flex-col gap-2">
      <div data-base-ui-swipe-ignore className="relative h-[min(70vw,18rem)] overflow-hidden rounded-lg bg-muted">
        <Cropper image={source} crop={crop} zoom={zoom} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} aspect={1} cropShape="round" showGrid={false}
          onCropChange={setCrop} onZoomChange={setZoom}
          onCropComplete={(_, area: Area) => { if (area.width > 0 && area.height > 0) onArea(area) }} />
      </div>
      <div data-base-ui-swipe-ignore className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label="축소" disabled={isBusy || zoom <= MIN_ZOOM}
          onClick={() => setZoom(value => clamp(value - 0.25))} className="max-md:size-11">
          <MinusIcon />
        </Button>
        <input type="range" aria-label="확대 비율" aria-valuetext={percent} min={MIN_ZOOM} max={MAX_ZOOM} step={0.05} value={zoom} disabled={isBusy}
          onChange={event => setZoom(clamp(Number(event.currentTarget.value)))}
          className="h-7 min-w-0 flex-1 cursor-pointer rounded-full accent-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 max-md:h-11" />
        <Button type="button" variant="ghost" size="icon" aria-label="확대" disabled={isBusy || zoom >= MAX_ZOOM}
          onClick={() => setZoom(value => clamp(value + 0.25))} className="max-md:size-11">
          <PlusIcon />
        </Button>
        <span aria-hidden className="w-11 text-right text-sm text-muted-foreground tabular-nums">{percent}</span>
      </div>
    </div>
  )
}
