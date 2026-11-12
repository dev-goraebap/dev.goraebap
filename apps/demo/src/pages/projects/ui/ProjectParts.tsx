import type { ReactNode } from "react"
import { useUpdateProject, type Project } from "@/entities/project"
import { projectPath } from "@/shared/config"
import { cn } from "cn"
import { ActionMenu } from "@/shared/ui/action-menu"
import { Button } from "@/shared/ui/button"
import { ArchiveIcon, ArchiveUpIcon, CopyIcon, StarIcon, UsersIcon } from "@/shared/ui/icon"
import { PersonAvatar } from "@/shared/ui/person-avatar"
import { Progress } from "@/shared/ui/progress"
import { RowLink } from "@/shared/ui/row-link"
import { toast } from "@/shared/ui/toast"

/**
 * 프로젝트 이름을 그 프로젝트의 업무(/projects/$projectKey/work-items)로 잇는 줄 링크(줄 · 카드 전체가 눌리고, 별표 · 메뉴만 따로 눌린다).
 */
export function ProjectLink({ projectKey, className, children }: { projectKey: string; className?: string; children: ReactNode }) {
  return (
    <RowLink to={projectPath(projectKey)} className={className}>
      {children}
      <span className="sr-only"> 업무 열기</span>
    </RowLink>
  )
}

/** 리드: 아바타와 이름. */
export function ProjectLead({ project, className }: { project: Project; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5 text-muted-foreground", className)}>
      <PersonAvatar id={project.lead.id} name={project.lead.name} />
      <span className="truncate">{project.lead.name}</span>
    </span>
  )
}

/** 진행률: 가는 막대와 백분율. */
export function ProjectProgress({ project, className }: { project: Project; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Progress value={project.progress} aria-label={`${project.name} 진행률`} className="min-w-0 flex-1" />
      <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{project.progress}%</span>
    </span>
  )
}

/** 멤버 수. */
export function ProjectMembers({ project }: { project: Project }) {
  return (
    <span aria-label={`멤버 ${project.memberCount}명`} className="flex w-8 items-center gap-1 text-xs text-muted-foreground tabular-nums">
      <UsersIcon aria-hidden className="size-3.5" />{project.memberCount}
    </span>
  )
}

/** 별표: 켜면 내 메뉴(사이드바 프로젝트 아래)에 둔다. 보관한 프로젝트에는 없다. */
export function ProjectStar({ project }: { project: Project }) {
  const update = useUpdateProject()
  return (
    <Button variant="ghost" size="icon-xs" aria-pressed={project.starred} className="relative z-1 max-md:size-11"
      aria-label={project.starred ? `${project.name} 즐겨찾기 해제` : `${project.name} 즐겨찾기`}
      onClick={() => update.mutate({ key: project.key, patch: { starred: !project.starred } })}>
      <StarIcon chosen={project.starred} className={cn("max-md:size-5", !project.starred && "text-icon-muted")} />
    </Button>
  )
}

const copyKey = (project: Project) => void navigator.clipboard.writeText(project.key).then(
  () => toast.add({ type: "success", title: `${project.key}를 복사했습니다` }),
  () => toast.add({ type: "error", title: "복사하지 못했습니다" }),
)

/** 줄 · 카드 끝의 … 메뉴: 키 복사, 보관 또는 보관 해제. 보관하면 별표도 뺀다. */
export function ProjectMenu({ project }: { project: Project }) {
  const update = useUpdateProject()
  const isArchived = project.status === "archived"
  const change = () => {
    update.mutate({ key: project.key, patch: isArchived ? { status: "active" } : { status: "archived", starred: false } })
    toast.add({ type: "success", title: isArchived ? `${project.name}을(를) 진행 중으로 옮겼습니다` : `${project.name}을(를) 보관했습니다` })
  }
  return (
    <span className="relative z-1 flex">
      <ActionMenu label={`${project.name} 메뉴`} title={project.name} size="row" actions={[
        { label: "키 복사", icon: CopyIcon, onSelect: () => copyKey(project) },
        isArchived ? { label: "보관 해제", icon: ArchiveUpIcon, onSelect: change } : { label: "보관", icon: ArchiveIcon, onSelect: change },
      ]} />
    </span>
  )
}
