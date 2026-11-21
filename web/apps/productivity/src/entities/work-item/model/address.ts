/** A work item's reference (COWORK-12) read as its project's key and its number; nothing when it is no reference. */
export function parseWorkItemRef(ref: string): { key: string; number: number } | undefined {
  const match = /^([A-Za-z0-9]{2,10})-(\d+)$/.exec(ref);
  return match ? { key: match[1]!.toUpperCase(), number: Number(match[2]) } : undefined;
}

/** Where a work item opens, as client/ addresses it: under its project (/projects/cowork/work-items/12). */
export const workItemHref = (workItem: { projectKey: string; number: number }) => `/workspace/projects/${workItem.projectKey}/work-items/${workItem.number}`;

/**
 * Where a work item opens when only its reference is known (COWORK-12): its one address under its project. A
 * reference that is no reference stays as it was, so a wrong one shows as not found there.
 */
export const workspaceWorkItemHref = (workItem: { ref: string }) => {
  const parsed = parseWorkItemRef(workItem.ref);
  return parsed ? workItemHref({ projectKey: parsed.key, number: parsed.number }) : `/workspace/projects/${workItem.ref}`;
};

/** 새 업무의 주소 하나: 프로젝트 안에서 열면 그 프로젝트를 미리 고른다(?project=). */
export const newWorkItemHref = (projectKey?: string) => `/workspace/work-items/new${projectKey ? `?project=${encodeURIComponent(projectKey)}` : ''}`;
