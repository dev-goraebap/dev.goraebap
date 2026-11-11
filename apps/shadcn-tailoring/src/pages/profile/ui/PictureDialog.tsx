import { useState } from "react"
import { useUpdateMe, type Member } from "@/entities/member"
import { DRAWN_AVATARS, derivedAvatar, drawnAvatarSource } from "@/shared/lib/avatar"
import { cn } from "@/shared/lib/utils"
import { CheckIcon } from "@/shared/ui/icon"
import { toast } from "@/shared/ui/toast"
import { EditDialog } from "./EditDialog"

const NUMBERS = Array.from({ length: DRAWN_AVATARS }, (_, number) => number)

/**
 * 프로필 이미지 고르기(호호코워크 PictureDialog의 기본 그림): 그림 18장 중 하나. 고른 그림에 테와 틱, 처음 그림
 * (아이디로 정해지는 것)에는 "기본". 저장하면 이 브라우저에 남고 목록 · 프로필 · 내 정보가 함께 바뀐다.
 */
export function PictureDialog({ me, open, onOpenChange }: { me: Member; open: boolean; onOpenChange: (open: boolean) => void }) {
  const fallback = derivedAvatar(me.id)
  const [chosen, setChosen] = useState(me.picture ?? fallback)
  const update = useUpdateMe()
  const save = () => update.mutate({ picture: chosen }, {
    onSuccess: () => {
      toast.add({ type: "success", title: "프로필 이미지를 바꿨습니다" })
      onOpenChange(false)
    },
  })
  return (
    <EditDialog open={open} onOpenChange={onOpenChange} title="프로필 이미지 변경" description="다른 구성원에게 보일 그림을 고르세요."
      isSubmitDisabled={chosen === (me.picture ?? fallback)} onSubmit={save}>
      <div role="radiogroup" aria-label="프로필 그림" className="grid grid-cols-6 gap-2 max-md:gap-3">
        {NUMBERS.map(number => {
          const isChosen = number === chosen
          return (
            <button key={number} type="button" role="radio" aria-checked={isChosen} aria-label={`그림 ${number + 1}${number === fallback ? " (기본)" : ""}`}
              onClick={() => setChosen(number)}
              className={cn("relative aspect-square rounded-full outline-none ring-offset-2 ring-offset-popover transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50",
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
    </EditDialog>
  )
}
