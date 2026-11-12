import { useMemo } from "react"
import { announcementHref, categoryLabel, useAnnouncements } from "@/entities/announcement"
import { meetingHref, useMeetings } from "@/entities/meeting"
import { departmentOf, MemberAvatar, useMembers } from "@/entities/member"
import { ProjectMark, useProjects } from "@/entities/project"
import { useWorkItems, workItemHref } from "@/entities/work-item"
import { paths, projectPath } from "@/shared/config"
import { KanbanSquareIcon, MeetingIcon, MegaphoneIcon, ProjectsIcon, UserIcon } from "@/shared/ui/icon"
import { NAV_PLACES } from "@/widgets/app-shell"
import type { SearchHit, SearchSource } from "@/widgets/global-search"

/** 비었을 때의 바로 가기: 나와 워크스페이스의 메뉴(호호코워크와 같다). */
const SHORTCUT_WHERE = ["나", "워크스페이스"]

const pageHits: SearchHit[] = NAV_PLACES.map(place => ({ id: `page:${place.path}`, label: place.label, where: place.where, href: place.path, icon: place.icon }))

/**
 * 전역 검색이 보는 곳: 페이지(메뉴 이름), 업무 · 공지 · 회의록 · 사람 · 프로젝트. 서버 검색이 없으므로 각 목록 쿼리(모의 데이터)를
 * 이 브라우저에서 거른다. 출처 순서가 결과 묶음의 순서다.
 */
export function useSearchSources() {
  const workItems = useWorkItems()
  const announcements = useAnnouncements()
  const meetings = useMeetings()
  const members = useMembers()
  const projects = useProjects()
  const sources = useMemo((): SearchSource[] => [
    { id: "pages", title: "페이지", hits: pageHits },
    {
      id: "work-items", title: "업무", isLoading: workItems.isPending,
      hits: (workItems.data ?? []).map(item => ({ id: `work-item:${item.key}`, label: item.title, where: item.key, href: workItemHref(item.key), icon: KanbanSquareIcon })),
    },
    {
      id: "announcements", title: "공지", isLoading: announcements.isPending,
      hits: (announcements.data ?? []).map(each => ({
        id: `announcement:${each.id}`, label: each.title, where: categoryLabel(each.category), href: announcementHref(each.id), icon: MegaphoneIcon,
      })),
    },
    {
      id: "meetings", title: "회의록", isLoading: meetings.isPending,
      hits: (meetings.data ?? []).map(meeting => ({ id: `meeting:${meeting.id}`, label: meeting.title, where: meeting.project, href: meetingHref(meeting.id), icon: MeetingIcon })),
    },
    {
      id: "members", title: "사람", isLoading: members.isPending,
      hits: (members.data ?? []).map(member => ({
        id: `member:${member.id}`, label: member.name, where: departmentOf(member.departmentId)?.name, href: `${paths.members}/${member.id}`, icon: UserIcon,
        media: <MemberAvatar member={member} />,
      })),
    },
    {
      id: "projects", title: "프로젝트", isLoading: projects.isPending,
      hits: (projects.data ?? []).filter(project => project.status === "active").map(project => ({
        id: `project:${project.key}`, label: project.name, where: project.key, href: projectPath(project.slug), icon: ProjectsIcon,
        media: <ProjectMark icon={project.icon} color={project.color} size="sm" />,
      })),
    },
  ], [workItems.isPending, workItems.data, announcements.isPending, announcements.data, meetings.isPending, meetings.data,
    members.isPending, members.data, projects.isPending, projects.data])
  return { sources, shortcuts: pageHits.filter(hit => hit.where && SHORTCUT_WHERE.includes(hit.where)) }
}
