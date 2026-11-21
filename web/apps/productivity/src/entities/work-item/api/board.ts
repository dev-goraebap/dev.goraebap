import type { QueryClient } from '@tanstack/react-query';
import { sendCommand, sendCreate } from '@/shared/api';
import type { ColumnCategory } from '../model/types';
import { workItemKeys } from './work-items';

/*
 * A project's own statuses (its board's columns), changed in its 설정, and the workspace's labels and work item types,
 * changed in 프로젝트 관리, by a Workspace administrator. Each change reads the columns, labels or types, and every work
 * item list, again.
 */

const at = (key: string) => `/api/v1/workspace/projects/${encodeURIComponent(key)}`;

/** A status as it is written: its name and the category it counts as. */
export type ColumnInput = { name: string; category: ColumnCategory };
/** A label as it is written: its name and colour (#rrggbb). */
export type LabelInput = { name: string; color: string };

export const createColumn = (key: string, input: ColumnInput) => sendCreate(`${at(key)}/columns`, input).then(() => undefined);
export const editColumn = (key: string, id: string, input: ColumnInput) => sendCommand(`${at(key)}/columns/${id}`, 'PATCH', input);
/** Refused while a work item is in it (ISSUE_COLUMN_NOT_EMPTY) or when it is the last one (ISSUE_COLUMN_LAST). */
export const deleteColumn = (key: string, id: string) => sendCommand(`${at(key)}/columns/${id}`, 'DELETE');
/** Every column of the project, each once, in the new order. */
export const orderColumns = (key: string, ids: readonly string[]) => sendCommand(`${at(key)}/columns/order`, 'PUT', { ids });

const LABELS = '/api/v1/workspace/work-item-labels';
const TYPES = '/api/v1/workspace/work-item-types';

export const createLabel = (input: LabelInput) => sendCreate(LABELS, input).then(() => undefined);
export const editLabel = (id: string, input: LabelInput) => sendCommand(`${LABELS}/${id}`, 'PATCH', input);
/** Takes the label off every work item that carries it. */
export const deleteLabel = (id: string) => sendCommand(`${LABELS}/${id}`, 'DELETE');
/** Every label, each once, in the new order. */
export const orderLabels = (ids: readonly string[]) => sendCommand(`${LABELS}/order`, 'PUT', { ids });

/** A type as it is written: its name, its mark (a Solar icon name, a #rrggbb colour), and whether it becomes the default. */
export type TypeInput = { name: string; icon: string; color: string; isDefault: boolean };
export const createType = (input: TypeInput) => sendCreate(TYPES, input).then(() => undefined);
export const editType = (code: string, input: TypeInput) => sendCommand(`${TYPES}/${encodeURIComponent(code)}`, 'PATCH', input);
/** Refused for the default type and for one a work item keeps (ISSUE_TYPE_IN_USE). */
export const deleteType = (code: string) => sendCommand(`${TYPES}/${encodeURIComponent(code)}`, 'DELETE');
/** Every type, by code, each once, in the new order. */
export const orderTypes = (codes: readonly string[]) => sendCommand(`${TYPES}/order`, 'PUT', { codes });

/** After a change to a project's columns or labels: they, and the lists and boards drawn with them, read again. */
export const refreshBoard = (client: QueryClient) => client.invalidateQueries({ queryKey: workItemKeys.all });
