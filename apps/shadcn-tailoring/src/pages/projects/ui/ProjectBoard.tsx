import { ProjectMark, type Project, type ProjectStatus } from "@/entities/project"
import { ArchiveIcon, ProjectsIcon, type Icon } from "@/shared/ui/icon"
import { ProjectLead, ProjectLink, ProjectMenu, ProjectProgress, ProjectStar } from "./ProjectParts"

const COLUMNS: { status: ProjectStatus; label: string; icon: Icon }[] = [
  { status: "active", label: "진행 중", icon: ProjectsIcon },
  { status: "archived", label: "보관", icon: ArchiveIcon },
]

/** 보드 카드: 표식 · 이름 · 별표 · 메뉴, 키와 설명, 아래에 리드와 진행률. 누르면 업무로 간다. */
function ProjectCard({ project }: { project: Project }) {
  return (
    <li className="relative flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm shadow-xs">
      <div className="flex items-center gap-2">
        <ProjectMark icon={project.icon} color={project.color} size="sm" />
        <ProjectLink projectKey={project.key} className="min-w-0 flex-1 truncate font-medium">{project.name}</ProjectLink>
        {project.status === "active" && <ProjectStar project={project} />}
        <ProjectMenu project={project} />
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">
        <span className="tabular-nums">{project.key}</span>{project.description && ` · ${project.description}`}
      </p>
      <div className="flex items-center justify-between gap-3 pt-1">
        <ProjectLead project={project} className="text-xs" />
        <ProjectProgress project={project} className="w-28 shrink-0" />
      </div>
    </li>
  )
}

/**
 * 보드 뷰: 상태(진행 중 · 보관)마다 칸, 칸 안에서 카드가 세로로 넘어간다. 업무 보드와 같은 칸 모양이다.
 * 휴대폰은 칸 하나 폭(304px)씩 옆으로 넘기며 칸에 맞춰 멈춘다.
 */
export function ProjectBoard({ projects }: { projects: Project[] }) {
  return (
    <div className="flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto p-3 max-md:scroll-px-3 md:snap-none">
      {COLUMNS.map(column => {
        const cards = projects.filter(project => project.status === column.status)
        return (
          <section key={column.status} aria-label={column.label} className="flex w-76 shrink-0 snap-start flex-col rounded-xl bg-band md:w-80">
            <header className="flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-medium md:h-10">
              <column.icon className="text-icon-muted" />
              {column.label}
              <span className="font-normal text-muted-foreground tabular-nums">{cards.length}</span>
            </header>
            <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {cards.map(project => <ProjectCard key={project.id} project={project} />)}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
