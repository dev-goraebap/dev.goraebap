import { BranchIcon } from "@/shared/ui/icon"
import { ProjectSettingsFrame } from "./ProjectSettingsFrame"

/** 프로젝트 설정의 저장소 연동(자리만 잡은 쪽). */
export function IntegrationSettings() {
  return <ProjectSettingsFrame label="저장소 연동" icon={BranchIcon}>{null}</ProjectSettingsFrame>
}
