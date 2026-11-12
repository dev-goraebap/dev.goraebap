import {
  CalendarIcon, FileTextIcon, FolderIcon, KeyRoundIcon, ListChecksIcon, MegaphoneIcon, NotesIcon, SettingsIcon, ShieldCheckIcon, SparklesIcon,
  StructureIcon, WorkflowIcon, BranchIcon, type Icon,
} from "@/shared/ui/icon"
import type { DocumentIconName } from "./types"

const ICONS: Record<DocumentIconName, Icon> = {
  document: FileTextIcon, notes: NotesIcon, structure: StructureIcon, workflow: WorkflowIcon, branch: BranchIcon, shield: ShieldCheckIcon,
  sparkles: SparklesIcon, megaphone: MegaphoneIcon, folder: FolderIcon, settings: SettingsIcon, checks: ListChecksIcon, key: KeyRoundIcon,
  calendar: CalendarIcon,
}

/** 문서 표식의 아이콘. 고르지 않은 문서는 문서 아이콘이다. */
export const documentIcon = (name: DocumentIconName = "document") => ICONS[name] ?? FileTextIcon

/** 색이 없는 문서 카드의 종이 색(호호코워크 팔레트의 갈색). */
export const PAPER_TONE = "#a16207"
