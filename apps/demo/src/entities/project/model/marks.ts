import {
  FlameIcon, FolderIcon, GamepadIcon, KanbanSquareIcon, MegaphoneIcon, MonitorIcon, ProjectsIcon, ShieldCheckIcon, SparklesIcon, UsersIcon,
  type Icon,
} from "@/shared/ui/icon"
import type { ProjectIconName, ProjectPerson } from "./types"

/** 프로젝트 표식으로 고를 수 있는 아이콘(호호코워크 MarkPicker의 자주 쓰는 아이콘 일부). */
export const PROJECT_ICONS: readonly { value: ProjectIconName; label: string; icon: Icon }[] = [
  { value: "projects", label: "가방", icon: ProjectsIcon },
  { value: "kanban", label: "보드", icon: KanbanSquareIcon },
  { value: "monitor", label: "화면", icon: MonitorIcon },
  { value: "gamepad", label: "게임", icon: GamepadIcon },
  { value: "sparkles", label: "반짝", icon: SparklesIcon },
  { value: "shield", label: "방패", icon: ShieldCheckIcon },
  { value: "megaphone", label: "확성기", icon: MegaphoneIcon },
  { value: "folder", label: "폴더", icon: FolderIcon },
  { value: "flame", label: "불꽃", icon: FlameIcon },
  { value: "users", label: "사람들", icon: UsersIcon },
]
export const projectIcon = (name: ProjectIconName) => (PROJECT_ICONS.find(each => each.value === name) ?? PROJECT_ICONS[0]).icon

/** 표식 색(호호코워크 PALETTE 일부). 서버가 #RRGGBB로 저장하는 데이터 색이다. */
export const PROJECT_COLORS: readonly { value: string; label: string }[] = [
  { value: "#3b82f6", label: "파랑" }, { value: "#14b8a6", label: "청록" }, { value: "#22c55e", label: "초록" },
  { value: "#eab308", label: "노랑" }, { value: "#f97316", label: "주황" }, { value: "#ef4444", label: "빨강" },
  { value: "#ec4899", label: "분홍" }, { value: "#8b5cf6", label: "보라" }, { value: "#6b7280", label: "회색" },
]

/** 리드로 고를 수 있는 사람. 아이디는 업무의 사람과 같아 같은 기본 아바타가 나온다. */
export const PROJECT_PEOPLE: readonly ProjectPerson[] = ["고재범", "김하늘", "이도윤", "박서준"].map((name, index) => ({ id: `person-${index}`, name }))

/** 이름에서 키를 제안한다: 영문 · 숫자만 대문자로 네 자까지. */
export const keyFrom = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4)
/** 키: 영문 대문자 · 숫자 2~10자. */
export const PROJECT_KEY = /^[A-Z0-9]{2,10}$/
