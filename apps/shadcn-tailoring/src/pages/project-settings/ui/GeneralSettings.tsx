import { SettingsIcon } from "@/shared/ui/icon"
import { ProjectSettingsFrame } from "./ProjectSettingsFrame"

/** 프로젝트 설정의 일반(자리만 잡은 쪽). */
export function GeneralSettings() {
  return <ProjectSettingsFrame label="일반" icon={SettingsIcon}>{null}</ProjectSettingsFrame>
}
