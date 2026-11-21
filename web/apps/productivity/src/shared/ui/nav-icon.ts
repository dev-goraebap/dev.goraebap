import {
  ArchiveIcon, BellIcon, BookIcon, BranchIcon, BriefcaseIcon, BuildingIcon, CalendarIcon, CheckIcon, ClockIcon, CommentIcon, ComponentIcon, CopyIcon, DashboardIcon,
  EyeIcon, FileTextIcon, FolderIcon, GamepadIcon, HomeIcon, InboxIcon, InboxInIcon, KanbanSquareIcon, LayoutGridIcon, ListFilterIcon, ListIcon,
  MeetingIcon, MonitorIcon, NotesIcon, PlusIcon, ProjectsIcon, RanksIcon, SearchIcon, SettingsIcon, ShieldCheckIcon, SparklesIcon, StructureIcon,
  TableIcon, TagIcon, TeamIcon, UmbrellaIcon, UserIcon, UsersIcon, WorkflowIcon, MegaphoneIcon, ListChecksIcon, RepeatIcon, type Icon,
} from '@/shared/ui/kit/icon';

/**
 * The menus' icons by their meaning name (nav.ts keeps names, as the server's marks do): the generated Solar icons under
 * lucide's names. A name not here draws the document icon.
 */
const NAV_ICONS: Record<string, Icon> = {
  inbox: InboxIcon, received: InboxInIcon, calendar: CalendarIcon, tasks: NotesIcon, document: FileTextIcon, projects: ProjectsIcon,
  clock: ClockIcon, meeting: MeetingIcon, notice: MegaphoneIcon, people: UsersIcon, town: GamepadIcon, shield: ShieldCheckIcon,
  team: TeamIcon, user: UserIcon, bell: BellIcon, computer: MonitorIcon, agent: SparklesIcon, departments: StructureIcon,
  ranks: RanksIcon, checklist: ListChecksIcon, leave: UmbrellaIcon, book: BookIcon, dashboard: DashboardIcon, settings: SettingsIcon,
  tag: TagIcon, folder: FolderIcon, workflow: WorkflowIcon, branch: BranchIcon, home: HomeIcon, filter: ListFilterIcon,
  'layout-list': ListIcon, 'layout-board': KanbanSquareIcon, 'layout-table': TableIcon, archive: ArchiveIcon, view: EyeIcon,
  repeat: RepeatIcon, copy: CopyIcon, plus: PlusIcon, check: CheckIcon, comment: CommentIcon, component: ComponentIcon, dashboardGrid: LayoutGridIcon,
  office: BuildingIcon, work: BriefcaseIcon, search: SearchIcon,
};

export const navIcon = (name: string): Icon => NAV_ICONS[name] ?? FileTextIcon;

/** 페이지 머리의 경로 한 단계. 아이콘은 뜻 이름(글자)이며, 메뉴(crumbsOf)가 정한 것을 그대로 페이지에 넘긴다. */
export type Crumb = { label: string; href?: string; icon?: string };

/** 페이지 머리 경로를 kit Page가 받는 꼴(아이콘 부품)로 바꾼다. */
export const pageCrumbs = (crumbs: readonly Crumb[]) =>
  crumbs.map(({ icon, ...crumb }) => ({ ...crumb, icon: icon ? navIcon(icon) : undefined }));
