import { Link } from "@tanstack/react-router"
import { cn } from "@/shared/lib/utils"
import { groupOf, kindIcon, notificationGroups, type Notification } from "@/entities/notification"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from "@/shared/ui/empty"
import { Skeleton } from "@/shared/ui/skeleton"
import { supportingText } from "./text"
import { emptyTitle, isInView, viewOf, type InboxView } from "../model/views"

/**
 * 알림함 목록. 전체 뷰는 "내 결재 차례"(결재를 기다리는 요청)가 있으면 묶음 제목을 두고 그 아래 "최근 소식",
 * 다른 뷰는 묶음 없이 줄만. 읽는 동안은 줄 모양의 자리, 비면 Empty.
 */
export function NotificationList({ items, view, selectedId }: {
  items: Notification[] | undefined; view: InboxView; selectedId?: string
}) {
  if (!items) return <ListSkeleton />
  const shown = items.filter(item => isInView(item, view))
  if (shown.length === 0) return <ViewEmpty view={view} />
  const rows = (group: Notification[], label: string) => (
    <ul aria-label={label} className="flex flex-col text-sm">
      {group.map(item => <NotificationRow key={item.id} item={item} isSelected={item.id === selectedId} />)}
    </ul>
  )
  if (view !== "all") return rows(shown, viewOf(view).label)
  const groups = notificationGroups
    .map(group => ({ ...group, items: shown.filter(item => groupOf(item) === group.value) }))
    .filter(group => group.items.length > 0)
  if (groups.length === 1) return rows(groups[0].items, groups[0].label)
  return groups.map(group => (
    <section key={group.value} aria-label={group.label}>
      <h2 className={cn("px-4 py-2 font-semibold", supportingText)}>{group.label}</h2>
      {rows(group.items, group.label)}
    </section>
  ))
}

/**
 * 한 줄: 종류 아이콘, 제목과 한 줄 설명, 받은 때. 누르면 그 알림을 고른다(/notifications/$id, 뷰는 그대로).
 * 읽지 않은 줄은 글자색을 옅게 섞은 바탕, 고른 줄과 가리킨 줄은 한 단계 진하게.
 */
function NotificationRow({ item, isSelected }: { item: Notification; isSelected: boolean }) {
  const KindIcon = kindIcon[item.kind]
  return (
    <li className="border-b">
      <Link to="/notifications/$notificationId" params={{ notificationId: item.id }} search={true}
        aria-current={isSelected ? "true" : undefined} data-unread={item.isUnread || undefined}
        aria-label={item.isUnread ? `${item.title}, 읽지 않음` : undefined}
        className="flex items-center gap-2 bg-background px-4 py-3 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset aria-[current=true]:bg-muted data-unread:bg-[color-mix(in_srgb,var(--foreground)_9%,var(--background))] data-unread:hover:bg-[color-mix(in_srgb,var(--foreground)_14%,var(--background))] data-unread:aria-[current=true]:bg-[color-mix(in_srgb,var(--foreground)_14%,var(--background))] compact:py-1.5">
        <KindIcon className="shrink-0" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate">{item.title}</span>
          <span className={cn("truncate", supportingText)}>{item.meta}</span>
        </span>
        <span className={cn("shrink-0 tabular-nums", supportingText)}>{item.receivedAt}</span>
      </Link>
    </li>
  )
}

function ListSkeleton() {
  return (
    <ul aria-label="알림을 읽는 중" aria-busy="true" className="flex flex-col">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index} className="flex items-center gap-2 border-b bg-background px-4 py-3 compact:py-1.5">
          <Skeleton className="size-4 shrink-0" />
          <span className="flex flex-1 flex-col gap-1.5 py-0.5">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </span>
        </li>
      ))}
    </ul>
  )
}

function ViewEmpty({ view }: { view: InboxView }) {
  const ViewIcon = viewOf(view).icon
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon"><ViewIcon /></EmptyMedia>
        <EmptyTitle>{emptyTitle[view]}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  )
}
