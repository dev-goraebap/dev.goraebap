import { useQuery } from '@tanstack/react-query';
import type { WorkItemTypeRow } from '../model/types';
import { typesOptions } from './work-items';

/** The workspace's work item types in their order, and one by its code (undefined while they are read, or for one gone). */
export function useWorkItemTypes() {
  const types = useQuery(typesOptions()).data ?? [];
  return { types, typeOf: (code?: string): WorkItemTypeRow | undefined => types.find(type => type.code === code) };
}
