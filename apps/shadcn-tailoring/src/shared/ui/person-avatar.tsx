import { derivedAvatar, drawnAvatarSource } from "@/shared/lib/avatar"
import { cn } from "@/shared/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"

/**
 * 사람 아바타(원형). 고른 그림(picture)이 없으면 아이디로 정해지는 호호코워크 기본 그림을 쓴다. 그림이 뜨기 전에는 이름 첫 글자.
 * 기본 크기 20px(목록 줄 · 활동). 크기는 className의 size-*로 바꾼다(Avatar의 size 변형을 고정하지 않아 어떤 크기든 이긴다).
 */
export function PersonAvatar({ id, name, picture, className }: { id: string; name: string; picture?: string; className?: string }) {
  return (
    <Avatar className={cn("size-5", className)}>
      <AvatarImage src={picture ?? drawnAvatarSource(derivedAvatar(id))} alt="" />
      <AvatarFallback className="text-[0.625rem] font-semibold">{name.slice(0, 1)}</AvatarFallback>
    </Avatar>
  )
}
