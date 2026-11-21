import fs from "node:fs/promises"

// 키트 아이콘(src/shared/ui/kit/icon)을 만드는 생성기.
// shadcn 키트(src/shared/ui/kit/icon)가 부르는 아이콘 이름(lucide와 같은 이름)과 그 이름이 그리는 Solar 아이콘. 기본은 Linear,
// chosen(고름 · 열림 · 지금 자리)이면 같은 아이콘의 Bold Duotone이다. 이름을 더하면 npm run icons:ui로 다시 만든다.
// 이름이 lucide와 같은 것은 shadcn add가 만든 부품의 lucide-react import를 @/shared/ui/icon으로 바꾸기만 하면 되게 하려는 것이다.
const SOLAR = {
  // shadcn 부품이 쓰는 것
  ArrowDownIcon: "arrow-down", ArrowLeftIcon: "arrow-left", ArrowUpIcon: "arrow-up", ArrowUpDownIcon: "sort-vertical",
  CheckIcon: "check", ChevronDownIcon: "alt-arrow-down", ChevronLeftIcon: "alt-arrow-left", ChevronRightIcon: "alt-arrow-right",
  ChevronUpIcon: "alt-arrow-up", ChevronsLeftIcon: "double-alt-arrow-left", ChevronsRightIcon: "double-alt-arrow-right",
  CircleCheckIcon: "check-circle", EllipsisIcon: "menu-dots", MoreHorizontalIcon: "menu-dots", InfoIcon: "info-circle",
  Loader2Icon: "refresh-circle", MinusIcon: "minus", OctagonXIcon: "danger-circle", PanelLeftIcon: "panel-left",
  SearchIcon: "magnifier", TriangleAlertIcon: "danger-triangle", XIcon: "close",
  // 화면 (cowork 화면을 옮길 때 쓰는 것. 없는 아이콘은 여기에 Solar 이름으로 더한다)
  BriefcaseIcon: "case-minimalistic", BuildingIcon: "buildings-2", CalendarIcon: "calendar", ClockIcon: "clock-circle", FileTextIcon: "document-text", FlameIcon: "fire", FolderIcon: "folder",
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
  InboxInIcon: "inbox-in", MaximizeIcon: "full-screen", MinimizeIcon: "quit-full-screen", MapPinIcon: "map-point",
  CircleXIcon: "close-circle", MailIcon: "letter-unread",
  // 일정
  RowsIcon: "rows-3",
  // 목록 끝 줄의 수 앞(2026-11-15): Solar star-angle(Astronomy)
  StarAngleIcon: "star-angle",
  // 공지사항 · 회의록
  PinIcon: "pin", PaperclipIcon: "paperclip", EyeIcon: "eye", DownloadIcon: "download-minimalistic", FileIcon: "file", ImageIcon: "gallery",
  NotesIcon: "notes",
  // 구성원 · 내 정보
  StructureIcon: "structure", PhoneIcon: "phone", GalleryEditIcon: "gallery-edit", LetterIcon: "letter",
  // 근태 · 휴가 · 프로젝트
  UmbrellaIcon: "umbrella", StarIcon: "star", ArchiveUpIcon: "archive-up", HashtagIcon: "hashtag",
  // 전역 검색 · 로그인
  HistoryIcon: "history", LogoutIcon: "logout-2",
  // 프로젝트 공간: 사이클 · 문서 · 워크플로 · 저장소 연동
  RepeatIcon: "repeat", FolderWithFilesIcon: "folder-with-files", WorkflowIcon: "routing-2", BranchIcon: "branching-paths-up",
  // 끌어 옮기기 손잡이 · 비밀값 숨기기 · 격자 보기
  GripIcon: "hamburger-menu", EyeClosedIcon: "eye-closed", LayoutGridIcon: "widget-4",
  // 파일 올리기 · 회의 녹음
  UploadIcon: "upload-minimalistic", MicrophoneIcon: "microphone-large",
  // 지우기 · 댓글 · 폴더로 옮기기 · 되살리기(Trash2Icon은 가벼운 빼기, TrashIcon은 지우기)
  TrashIcon: "trash-bin-trash", MessageCircleIcon: "chat-round-line", FolderInputIcon: "move-to-folder", RotateCcwIcon: "undo-left-round",

  // ── 리치 에디터 · 문서 편집기(shared/ui/editor · document)
  BoldIcon: "text-bold", ItalicIcon: "text-italic", UnderlineIcon: "text-underline", StrikethroughIcon: "text-cross", CodeIcon: "code",
  HeadingIcon: "text-format", PilcrowIcon: "text-square", ListOrderedIcon: "list-ordered", QuoteIcon: "quote", SquareCodeIcon: "code-square",
  GlobeIcon: "global", PaletteIcon: "palette-round", ReplaceIcon: "square-transfer-horizontal", EraserIcon: "eraser", ClipboardIcon: "clipboard",
  Link2Icon: "link-minimalistic-2", ArrowRightIcon: "arrow-right", CornerDownLeftIcon: "reply", VideoIcon: "video-frame-play-horizontal",
  MusicIcon: "music-note", ZoomInIcon: "magnifier-zoom-in", Undo2Icon: "undo-left", Redo2Icon: "undo-right", PrinterIcon: "printer-minimalistic",

  // ── cowork 화면: 옛 의미 이름(solarIcon)에서 옮겨 온 것
  TownIcon: "gamepad", CommitIcon: "git-commit", ComponentIcon: "widget-add", ReleaseIcon: "rocket", TicketIcon: "ticket",
  SoundIcon: "volume-loud", MutedIcon: "volume-cross", DashboardIcon: "widget", SentIcon: "plain", BookIcon: "book",
  SupportIcon: "help", DeskIcon: "headphones-round-sound", ContributeIcon: "git-pull-request", IdeaIcon: "lightbulb",
  RanksIcon: "ranking", TitleIcon: "medal-ribbon", TranscriptIcon: "microphone", HolidayIcon: "calendar-mark",
  LookupIcon: "user-id", PdfIcon: "file-text", SheetIcon: "file-spreadsheet", TeamIcon: "users-group-two-rounded",
  SunIcon: "sun", MoonIcon: "moon", SortDescIcon: "sort-from-top-to-bottom", SortAscIcon: "sort-from-bottom-to-top",
  EventIcon: "calendar-add", RestoreIcon: "restart", LockIcon: "lock-keyhole-minimalistic", MilestoneIcon: "signpost",
  DecisionIcon: "scale", BugIcon: "bug-minimalistic", EpicIcon: "bolt", CommentIcon: "chat-round-dots",
  CreatedIcon: "stars-2",
}

const solar = JSON.parse(await fs.readFile(new URL("../node_modules/@iconify-json/solar/icons.json", import.meta.url), "utf8"))
const body = (key, style) => solar.icons[`${key}-${style}`]?.body
const lines = Object.entries(SOLAR).map(([name, key]) => {
  const linear = body(key, "linear")
  if (!linear) throw new Error(`Solar 아이콘 없음: ${key}-linear`)
  const chosen = body(key, "bold-duotone")
  // 순수 표시: 표시가 없으면 묶을 때 solar() 호출을 지우지 못해, 아이콘 하나만 가져와도 전부(약 209KB)가 따라온다.
  return `export const ${name} = /* @__PURE__ */ solar(${JSON.stringify(name)}, ${JSON.stringify(linear)}${chosen ? `, ${JSON.stringify(chosen)}` : ""})`
})
// 머리 주석은 import 뒤에 둔다. shadcn add가 첫 문장 앞의 주석을 지우므로 앞에 두면 받은 프로젝트에서 저작자 표시가 사라진다.
await fs.writeFile(new URL("../src/shared/ui/kit/icon/icons.generated.ts", import.meta.url),
  `import { solar } from "./solar"\n\n// npm run icons:ui로 생성한다. 직접 고치지 않는다.\n// Solar icons by 480 Design, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).\n${lines.join("\n")}\n`)
