import { WorkflowIcon } from "@/shared/ui/icon"
import { ProjectSettingsFrame } from "./ProjectSettingsFrame"

/** 프로젝트 설정의 워크플로(자리만 잡은 쪽). */
export function WorkflowSettings() {
  return <ProjectSettingsFrame label="워크플로" icon={WorkflowIcon}>{null}</ProjectSettingsFrame>
}
