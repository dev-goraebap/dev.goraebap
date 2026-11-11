import { derivedAvatar, drawnAvatarSource } from "@/shared/lib/avatar"

/** 로그인한 사람(모의). 실제 세션이 생기면 entities로 옮긴다. 그림은 고르기 전까지 아이디로 정해지는 기본 그림이다. */
const id = "emp-goh"
export const me = { id, name: "고재범", team: "개발팀", initials: "재범", picture: drawnAvatarSource(derivedAvatar(id)), unread: 3 }
