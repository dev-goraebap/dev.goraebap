import fs from "node:fs/promises"

// 화면이 부르는 아이콘 이름(lucide와 같은 이름)과 그 이름이 그리는 Solar 아이콘. 호호코워크와 같이 기본은 Linear,
// chosen(고름 · 열림 · 지금 자리)이면 같은 아이콘의 Bold Duotone이다. 이름을 더하면 npm run icons로 다시 만든다.
const SOLAR = {
  // shadcn 부품이 쓰는 것
  ArrowDownIcon: "arrow-down", ArrowLeftIcon: "arrow-left", ArrowUpIcon: "arrow-up", ArrowUpDownIcon: "sort-vertical",
  CheckIcon: "check", ChevronDownIcon: "alt-arrow-down", ChevronLeftIcon: "alt-arrow-left", ChevronRightIcon: "alt-arrow-right",
  ChevronUpIcon: "alt-arrow-up", ChevronsLeftIcon: "double-alt-arrow-left", ChevronsRightIcon: "double-alt-arrow-right",
  CircleCheckIcon: "check-circle", EllipsisIcon: "menu-dots", MoreHorizontalIcon: "menu-dots", InfoIcon: "info-circle",
  Loader2Icon: "refresh-circle", MinusIcon: "minus", OctagonXIcon: "danger-circle", PanelLeftIcon: "panel-left",
  SearchIcon: "magnifier", TriangleAlertIcon: "danger-triangle", XIcon: "close",
  // 화면
  CalendarIcon: "calendar", ClockIcon: "clock-circle", FileTextIcon: "document-text", FlameIcon: "fire", FolderIcon: "folder",
  HomeIcon: "home-smile", InboxIcon: "inbox", KanbanSquareIcon: "kanban", KeyRoundIcon: "key", ListFilterIcon: "tuning-2",
  ListIcon: "list", MailOpenIcon: "letter-opened", MeetingIcon: "chat-round-line", MegaphoneIcon: "notification-unread-lines",
  PenSquareIcon: "pen-new-square", PencilIcon: "pen", PlusIcon: "add", ReplyAllIcon: "reply-2", ReplyIcon: "reply",
  SearchXIcon: "magnifier-zoom-out", SettingsIcon: "settings", ShieldCheckIcon: "shield-check", SparklesIcon: "stars",
  SquareArrowOutUpRightIcon: "arrow-right-up", TableIcon: "table", Trash2Icon: "trash-bin-minimalistic", UserIcon: "user-circle",
  UsersIcon: "users-group-rounded", BellIcon: "bell", ProjectsIcon: "case-round", GamepadIcon: "gamepad-minimalistic",
  SortIcon: "sort-vertical", MonitorIcon: "monitor", ArchiveIcon: "archive-down", LinkIcon: "link", CopyIcon: "copy", MoreVerticalIcon: "menu-dots",
  // 업무: 상태 · 우선순위 · 유형 · 라벨 표식과 보드 뷰
  CirclePauseIcon: "pause-circle", RefreshCwIcon: "refresh", SirenIcon: "siren", ListChecksIcon: "checklist", TagIcon: "tag",
  ChartNoAxesColumnIcon: "chart-2", SquareCheckIcon: "check-square", Maximize2Icon: "maximize-square-minimalistic",
  // 알림함
  InboxInIcon: "inbox-in", MaximizeIcon: "full-screen", ListChecksIcon: "checklist", MapPinIcon: "map-point",
  CircleXIcon: "close-circle", MailIcon: "letter-unread",
  // 일정
  RowsIcon: "rows-3",
}

const solar = JSON.parse(await fs.readFile(new URL("../node_modules/@iconify-json/solar/icons.json", import.meta.url), "utf8"))
const body = (key, style) => solar.icons[`${key}-${style}`]?.body
const lines = Object.entries(SOLAR).map(([name, key]) => {
  const linear = body(key, "linear")
  if (!linear) throw new Error(`Solar 아이콘 없음: ${key}-linear`)
  const chosen = body(key, "bold-duotone")
  return `export const ${name} = solar(${JSON.stringify(name)}, ${JSON.stringify(linear)}${chosen ? `, ${JSON.stringify(chosen)}` : ""})`
})
await fs.writeFile(new URL("../src/shared/ui/icon/icons.generated.ts", import.meta.url),
  `// npm run icons로 생성한다. 직접 고치지 않는다.\n// Solar icons by 480 Design, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).\nimport { solar } from "./solar"\n\n${lines.join("\n")}\n`)
