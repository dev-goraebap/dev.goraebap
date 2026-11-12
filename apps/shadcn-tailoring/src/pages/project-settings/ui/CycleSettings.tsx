import { RepeatIcon } from "@/shared/ui/icon"
import { ProjectSettingsFrame } from "./ProjectSettingsFrame"

/** 프로젝트 설정의 사이클(자리만 잡은 쪽). */
export function CycleSettings() {
  return <ProjectSettingsFrame label="사이클" icon={RepeatIcon}>{null}</ProjectSettingsFrame>
}
