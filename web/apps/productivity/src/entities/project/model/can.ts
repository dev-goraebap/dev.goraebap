import { useQuery } from '@tanstack/react-query';
import { projectOptions } from '../api/projects';

/**
 * What the signed-in member may do in a project, as the server said when the project was read (cowork-projects
 * 권한): view (its members), comment (view, the project not archived; viewers too), edit (editors and up) and manage
 * (its administrators). The screens hide what one cannot; the server still decides. Nothing until the project is read.
 */
export function useProjectCan(key: string | undefined) {
  const project = useQuery({ ...projectOptions(key ?? ''), enabled: !!key }).data;
  const can = project?.can;
  return {
    view: !!can?.view,
    comment: !!can?.view && !project?.archivedAt && !project?.deletedAt,
    edit: !!can?.edit,
    manage: !!can?.manage,
  };
}
