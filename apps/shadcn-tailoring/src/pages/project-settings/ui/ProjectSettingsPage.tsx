import { useParams } from "@tanstack/react-router"
import { NotFoundSection } from "./NotFoundSection"
import { CycleSettings } from "./CycleSettings"
import { GeneralSettings } from "./GeneralSettings"
import { IntegrationSettings } from "./IntegrationSettings"
import { WorkflowSettings } from "./WorkflowSettings"

const SECTIONS = { general: GeneralSettings, workflow: WorkflowSettings, cycles: CycleSettings, integrations: IntegrationSettings }

/** 프로젝트 관리(/projects/$projectKey/settings/$section): 일반 · 워크플로 · 사이클 · 저장소 연동 중 주소의 쪽을 그린다. */
export function ProjectSettingsPage() {
  const { section = "" } = useParams({ strict: false }) as { section?: string }
  const Section = SECTIONS[section as keyof typeof SECTIONS] ?? NotFoundSection
  return <Section />
}
