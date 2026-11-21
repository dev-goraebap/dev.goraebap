import type { WorkItemView } from './types';
import type { Session } from '@/shared/auth';

/** 서버와 같은 기준: 쓸 수 있는 프로젝트(에디터 이상)에서 업무를 만든 사람이나 그 프로젝트의 관리자만 지운다. */
export const canDeleteWorkItem = (view: WorkItemView | undefined, session: Session | null | undefined, managesProject: boolean) =>
  !!view && !!session && view.canWrite && (session.id === view.createdById || managesProject);
