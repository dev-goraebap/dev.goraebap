import { queryOptions } from '@tanstack/react-query';
import { getJson, type components } from '@/shared/api';

type Schemas = components['schemas'];
export type OrgPerson = Schemas['Person'] & Required<Pick<Schemas['Person'], 'id' | 'name'>>;
/** 일하는 사람들. */
type OrgChart = { people: OrgPerson[] };
export const directoryAgentKeys = ['directory-agents'] as const;

export const directoryAgentsOptions = (employeeId: string) => queryOptions({
  queryKey: [...directoryAgentKeys, employeeId],
  queryFn: ({ signal }) => getJson<Schemas['AgentActor'][]>(
    `/api/v1/directory/employees/${encodeURIComponent(employeeId)}/agents`, signal),
});

/**
 * Departments and working people, every member reads them; they change rarely during a visit. Under the departments'
 * key, so whatever refreshes the departments refreshes this too.
 */
export const orgChartOptions = () => queryOptions({
  queryKey: ['departments', 'org-chart'],
  queryFn: ({ signal }) => getJson<OrgChart>('/api/v1/directory/org-chart', signal),
  staleTime: 5 * 60_000,
});
