import { ProjectMark, type Project } from "@/entities/project"
import { cn } from "@/shared/lib/utils"
import { ProjectLead, ProjectLink, ProjectMembers, ProjectMenu, ProjectProgress, ProjectStar } from "./ProjectParts"

/** 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가리고, 가리키면 옅게 덮는다. */
const ROW = "relative flex items-center gap-3 border-b bg-background px-4 hover:bg-row-hover"

/**
 * 프로젝트 한 줄(호호코워크 ProjectsPage의 ListItem). 데스크톱: 표식, 이름과 "키 · 설명", 오른쪽에 리드 · 진행률 · 멤버 수 · 별표 · 메뉴.
 * 휴대폰: 표식, 이름과 "키 · 진행률 · 리드", 끝에 별표 · 메뉴. 어디를 눌러도 그 프로젝트의 업무로 간다.
 */
export function ProjectRow({ project, isCompact }: { project: Project; isCompact: boolean }) {
  const isActive = project.status === "active"
  if (isCompact) {
    return (
      <li className={cn(ROW, "py-3")}>
        <ProjectMark icon={project.icon} color={project.color} />
        <span className="flex min-w-0 flex-1 flex-col">
          <ProjectLink projectKey={project.key} className="truncate font-medium">{project.name}</ProjectLink>
          <span className="truncate text-xs text-muted-foreground tabular-nums">{project.key} · {project.progress}% · {project.lead.name}</span>
        </span>
        {isActive && <ProjectStar project={project} />}
        <ProjectMenu project={project} />
      </li>
    )
  }
  return (
    <li className={cn(ROW, "py-2.5 compact:py-1.5")}>
      <ProjectMark icon={project.icon} color={project.color} />
      <span className="flex min-w-0 flex-1 flex-col">
        <ProjectLink projectKey={project.key} className="truncate font-medium">{project.name}</ProjectLink>
        <span className="truncate text-xs text-muted-foreground">
          <span className="tabular-nums">{project.key}</span>{project.description && ` · ${project.description}`}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-5">
        <ProjectLead project={project} className="w-24" />
        <ProjectProgress project={project} className="w-36" />
        <ProjectMembers project={project} />
        <span className="flex w-13 items-center justify-end gap-1">
          {isActive && <ProjectStar project={project} />}
          <ProjectMenu project={project} />
        </span>
      </span>
    </li>
  )
}
