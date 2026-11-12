import { lazy, Suspense, useEffect, useId, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { memberPicture, useUpdateMe, type Member, type MyPatch } from "@/entities/member"
import { DRAWN_AVATARS, derivedAvatar, drawnAvatarSource } from "@/shared/lib/avatar"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { FileDropzone } from "@/shared/ui/compose"
import { FormDialog } from "@/shared/ui/form-dialog"
import { CheckIcon, UploadIcon } from "@/shared/ui/icon"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { Spinner } from "@/shared/ui/spinner"
import { toast } from "@/shared/ui/toast"
import { cropPicture, type CropArea } from "../model/crop-picture"
import { openPhoto, PHOTO_ACCEPT, PHOTO_MAX_BYTES } from "../model/photo"

// 자르개(react-easy-crop)는 사진을 고를 때만 필요하므로 따로 받는다.
const PictureCropper = lazy(() => import("./PictureCropper").then(module => ({ default: module.PictureCropper })))

const NUMBERS = Array.from({ length: DRAWN_AVATARS }, (_, number) => number)
const CROP_HEIGHT = "h-[min(70vw,18rem)]"

/**
 * 프로필 이미지 변경(호호코워크 features/picture-change): 사진을 올려 원 안에 맞춰 자르거나, 그림 18장 중 하나를 고른다.
 * 둘 중 마지막에 고른 것이 저장된다. "기본값으로"는 고른 것을 지우고 아이디로 정해지는 그림으로 바로 되돌린다.
 * 저장하면 내 줄 캐시가 바뀌어 사이드바 내 박스 · 구성원 목록 · 곳곳의 아바타가 함께 바뀐다.
 */
export function PictureDialog({ me, open, onOpenChange }: { me: Member; open: boolean; onOpenChange: (open: boolean) => void }) {
  const fallback = derivedAvatar(me.id)
  // 사진을 쓰는 중이면 그림은 아무것도 고르지 않은 채 연다.
  const initial = me.photo ? undefined : me.picture ?? fallback
  const [preset, setPreset] = useState(initial)
  /** 고른 원본의 object URL. 자르개가 읽고, 다른 것을 고르거나 닫으면 놓는다. */
  const [photo, setPhoto] = useState<string>()
  const [area, setArea] = useState<CropArea>()
  const [problem, setProblem] = useState<string>()
  // 사진을 여는 동안 다른 것을 고르면 늦게 열린 사진이 덮지 않도록 순번을 센다.
  const selection = useRef(0)
  const input = useRef<HTMLInputElement>(null)
  const presetsId = useId()
  const update = useUpdateMe()
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo) }, [photo])

  const save = useMutation({
    mutationFn: async (isReset: boolean) => {
      const patch: MyPatch = isReset ? { picture: undefined, photo: undefined }
        : photo && area ? { picture: undefined, photo: await cropPicture(photo, area) }
        : { picture: preset, photo: undefined }
      await update.mutateAsync(patch)
      return isReset
    },
    onSuccess: isReset => {
      toast.add({ type: "success", title: isReset ? "기본 이미지로 되돌렸습니다" : "프로필 이미지를 바꿨습니다" })
      onOpenChange(false)
    },
  })

  const choose = async (file?: File) => {
    if (!file) return
    const version = ++selection.current
    try {
      const url = await openPhoto(file)
      if (version !== selection.current) return URL.revokeObjectURL(url)
      setProblem(undefined)
      save.reset()
      setArea(undefined)
      setPhoto(url)
    } catch (error) {
      if (version === selection.current) setProblem(error instanceof Error ? error.message : String(error))
    }
  }
  const pick = (number: number) => {
    selection.current++
    setProblem(undefined)
    save.reset()
    setPhoto(undefined)
    setArea(undefined)
    setPreset(number)
  }

  const isDefault = me.picture === undefined && !me.photo
  const shown = preset === undefined ? memberPicture(me) : drawnAvatarSource(preset)
  const alert = problem ?? save.error?.message
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="프로필 이미지 변경" description="사진을 올리거나 기본 그림을 고르세요."
      isPending={save.isPending} isSubmitDisabled={photo ? !area : preset === initial} onSubmit={() => save.mutate(false)}>
      {photo ? (
        <div className="flex flex-col gap-2">
          <Suspense fallback={
            <div className={cn("flex items-center justify-center gap-2 rounded-lg bg-muted text-sm text-muted-foreground", CROP_HEIGHT)}>
              <Spinner />사진 편집기를 불러오는 중
            </div>
          }>
            {/* 사진마다 새로 그려 자리와 확대가 처음부터 시작한다. */}
            <PictureCropper key={photo} source={photo} isBusy={save.isPending} onArea={setArea} />
          </Suspense>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">끌어서 자리를, 막대나 휠로 크기를 맞추세요.</span>
            <Button type="button" variant="secondary" size="sm" disabled={save.isPending} onClick={() => input.current?.click()} className="shrink-0 max-md:h-9">
              <UploadIcon data-icon="inline-start" />다른 사진
            </Button>
          </div>
          <input ref={input} type="file" hidden aria-hidden tabIndex={-1} accept={PHOTO_ACCEPT}
            onChange={event => { void choose(event.currentTarget.files?.[0]); event.currentTarget.value = "" }} />
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <PersonAvatar id={me.id} name={me.name} picture={shown} className="size-16 shrink-0" />
          <div className="min-w-0 flex-1">
            <FileDropzone label="사진 올리기" hint="JPG, PNG, WebP, GIF · 최대 20 MB" accept={PHOTO_ACCEPT} maxBytes={PHOTO_MAX_BYTES}
              isDisabled={save.isPending} onPick={files => void choose(files[0])} />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span id={presetsId} className="text-sm font-medium">기본 그림</span>
          {/* FormDialog의 바닥 줄은 취소 · 저장뿐이라 호호코워크 바닥의 "기본값으로"를 그림 머리에 둔다. */}
          <Button type="button" variant="ghost" size="sm" disabled={isDefault || save.isPending} onClick={() => save.mutate(true)} className="max-md:h-9">
            기본값으로
          </Button>
        </div>
        <div role="radiogroup" aria-labelledby={presetsId} className="grid grid-cols-6 gap-2 max-md:gap-3">
          {NUMBERS.map(number => {
            const isChosen = !photo && number === preset
            return (
              <button key={number} type="button" role="radio" aria-checked={isChosen} aria-label={`그림 ${number + 1}${number === fallback ? " (기본)" : ""}`}
                disabled={save.isPending} onClick={() => pick(number)}
                className={cn("relative aspect-square rounded-full outline-none ring-offset-2 ring-offset-popover transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
                  isChosen && "ring-2 ring-foreground focus-visible:ring-foreground")}>
                <img src={drawnAvatarSource(number)} alt="" className="size-full rounded-full" />
                {isChosen && (
                  <span className="absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                    <CheckIcon className="size-3.5" />
                  </span>
                )}
                {number === fallback && !isChosen && (
                  <span className="absolute inset-x-0 -bottom-1 mx-auto w-fit rounded-full bg-popover px-1 text-[0.625rem] text-muted-foreground">기본</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      {alert && <p role="alert" className="text-sm text-destructive">{alert}</p>}
    </FormDialog>
  )
}
