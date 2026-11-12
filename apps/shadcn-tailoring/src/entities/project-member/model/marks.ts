import type { ProjectRole } from "./types"

export const PROJECT_ROLES: readonly { value: ProjectRole; label: string }[] = [
  { value: "lead", label: "리드" },
  { value: "member", label: "멤버" },
]

export const roleLabel = (role: ProjectRole) => (PROJECT_ROLES.find(each => each.value === role) ?? PROJECT_ROLES[1]).label
