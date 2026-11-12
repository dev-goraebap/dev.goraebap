import { SettingsIcon } from "@/shared/ui/icon"
import { PageState } from "@/shared/ui/page-state"
import { ProjectSettingsFrame } from "./ProjectSettingsFrame"

/** 모르는 설정 쪽. */
export function NotFoundSection() {
  return (
    <ProjectSettingsFrame label="설정" icon={SettingsIcon}>
      <PageState kind="not-found" title="설정을 찾을 수 없습니다" description="주소가 바뀌었거나 없는 설정입니다." />
    </ProjectSettingsFrame>
  )
}
