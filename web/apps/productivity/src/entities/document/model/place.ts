import type { QueryClient } from '@tanstack/react-query';
import { serverBodyStore, type RichBodyStore } from '@/shared/ui/rich-body';
import { documentPath } from '../api/documents';

/**
 * A document's body for RichBody, as a work item's: read and saved at /documents/{id}/body (409 when another save came
 * first), and its kept versions restored as a new version. canWrite is false for an archived project's document, which
 * is read but not changed.
 */
export function documentBodyStore({ id, author, canWrite, client, readerId }: { id: string; author: string; canWrite: boolean; client?: QueryClient; readerId?: string }): RichBodyStore {
  return serverBodyStore({ base: `${documentPath(id)}/body`, author, canWrite, client, readerId });
}
