import type { IconName } from '@kit/foundations/icons/solar-icon';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

export type Project = { id: string; name: string; isSample: boolean };
export type StepId = 'project' | 'invite' | 'notify';
/** done: 마침, later: 나중에 하기로 미룸, todo: 아직. */
export type StepState = 'todo' | 'done' | 'later';
export type Workspace = { projects: Project[]; steps: Record<StepId, StepState> };

/** 설정 체크리스트의 단계. 순서가 화면 순서다. */
export const steps: readonly { id: StepId; title: string; description: string; action: string; icon: IconName }[] = [
  { id: 'project', title: '프로젝트 만들기', description: '일을 모아 둘 첫 프로젝트를 만듭니다.', action: '만들기', icon: 'folder' },
  { id: 'invite', title: '팀원 초대하기', description: '함께 쓸 사람을 이메일로 초대합니다.', action: '초대하기', icon: 'people' },
  { id: 'notify', title: '알림 켜기', description: '멘션과 마감 알림을 받습니다.', action: '켜기', icon: 'bell' },
];

export type WorkspaceApi = {
  get: () => Promise<Workspace>;
  createProject: (name: string) => Promise<Project>;
  invite: (email: string) => Promise<void>;
  enableNotify: () => Promise<void>;
  /** 단계를 나중으로 미루거나(true) 다시 할 일로 되돌린다(false). */
  setLater: (step: StepId, isLater: boolean) => Promise<void>;
  /** 견본 프로젝트를 채운다. */
  fillSample: () => Promise<void>;
  /** 채웠던 견본 프로젝트만 지운다. */
  undoSample: () => Promise<void>;
};

export const WorkspaceApiContext = createContext<WorkspaceApi | null>(null);

export function useWorkspaceApi() {
  const api = useContext(WorkspaceApiContext);
  if (!api) throw new Error('WorkspaceApiContext가 필요합니다.');
  return api;
}

export const workspaceKey = ['workspace'] as const;

export function useWorkspace() {
  const api = useWorkspaceApi();
  return useQuery({ queryKey: workspaceKey, queryFn: () => api.get() });
}

/** 작업 공간을 바꾸는 동작 모음. 어느 동작이든 끝나면 작업 공간을 다시 읽는다. */
export function useWorkspaceActions() {
  const api = useWorkspaceApi();
  const client = useQueryClient();
  const settled = { onSettled: () => client.invalidateQueries({ queryKey: workspaceKey }) };
  return {
    createProject: useMutation({ mutationFn: (name: string) => api.createProject(name), ...settled }),
    invite: useMutation({ mutationFn: (email: string) => api.invite(email), ...settled }),
    enableNotify: useMutation({ mutationFn: () => api.enableNotify(), ...settled }),
    setLater: useMutation({ mutationFn: (input: { step: StepId; isLater: boolean }) => api.setLater(input.step, input.isLater), ...settled }),
    fillSample: useMutation({ mutationFn: () => api.fillSample(), ...settled }),
    undoSample: useMutation({ mutationFn: () => api.undoSample(), ...settled }),
  };
}

export const remainingOf = (workspace: Workspace) => steps.filter(step => workspace.steps[step.id] === 'todo').length;
