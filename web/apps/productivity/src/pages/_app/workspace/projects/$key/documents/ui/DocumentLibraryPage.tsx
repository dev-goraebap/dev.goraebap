import { ProjectLibrary, type DetailSurfaceOptions } from './ProjectLibrary';
import type { Crumb } from '../model/page-tools';

/** 프로젝트 문서함: 목록과 옆에 연 문서. 데스크톱에서 목록 위 대화상자(PanelHost)로도 연다. */
export function DocumentLibraryPage({
  crumbs,
  projectKey,
  documentId,
  ...surface
}: {
  crumbs: Crumb[];
  projectKey: string;
  documentId?: string;
} & DetailSurfaceOptions) {
  return <ProjectLibrary key={projectKey} crumbs={crumbs} projectKey={projectKey} documentId={documentId} {...surface} />;
}
