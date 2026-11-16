import { cn } from "cn"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"

/**
 * 사람 아바타(원형). 고른 그림(picture)이 있으면 그것을, 없거나 뜨기 전에는 이름 첫 글자를 보인다.
 * 기본 그림은 제품마다 다르므로 키트에 두지 않는다. 제품이 기본 그림을 정하면 picture로 넘긴다.
 * 기본 크기 20px(목록 줄 · 활동). 크기는 className의 size-*로 바꾼다(Avatar의 size 변형을 고정하지 않아 어떤 크기든 이긴다).
 */
export function PersonAvatar({ name, picture, className }: { name: string; picture?: string; className?: string }) {
  return (
    <Avatar className={cn("size-5", className)}>
      {picture && <AvatarImage src={picture} alt="" />}
      <AvatarFallback className="text-[0.625rem] font-semibold">{name.slice(0, 1)}</AvatarFallback>
    </Avatar>
  )
}
