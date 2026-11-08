import type { Project, StepId, StepState, Workspace, WorkspaceApi } from '../entities/workspace';

const wait = (ms: number) => new Promise<void>(resolve => { setTimeout(resolve, ms); });

const sampleNames = ['디자인 시스템 정리', '온보딩 흐름 개선', '분기 회고 준비'];

/** 시작 상태: empty는 아무것도 없는 새 작업 공간, progress는 첫 프로젝트만 만든 상태. */
export type Seed = 'empty' | 'progress';

export function createWorkspaceApi({ delay = 0, seed = 'empty' }: { delay?: number; seed?: Seed } = {}): WorkspaceApi {
  let serial = 0;
  const next = (isSample: boolean): Project => ({ id: `p${(serial += 1)}`, name: '', isSample });
  const state = {
    projects: [] as Project[],
    steps: { project: 'todo', invite: 'todo', notify: 'todo' } as Record<StepId, StepState>,
  };
  if (seed === 'progress') {
    state.projects = [{ ...next(false), name: '디자인 시스템 정리' }];
    state.steps.project = 'done';
  }
  const snapshot = (): Workspace => ({ projects: [...state.projects], steps: { ...state.steps } });
  return {
    async get() { await wait(delay); return snapshot(); },
    async createProject(name) {
      await wait(delay);
      const project = { ...next(false), name };
      state.projects = [project, ...state.projects];
      state.steps.project = 'done';
      return project;
    },
    async invite() { await wait(delay); state.steps.invite = 'done'; },
    async enableNotify() { await wait(delay); state.steps.notify = 'done'; },
    async setLater(step, isLater) {
      await wait(delay);
      if (state.steps[step] !== 'done') state.steps[step] = isLater ? 'later' : 'todo';
    },
    async fillSample() {
      await wait(delay);
      state.projects = [...sampleNames.map(name => ({ ...next(true), name })), ...state.projects];
    },
    async undoSample() {
      await wait(delay);
      state.projects = state.projects.filter(project => !project.isSample);
    },
  };
}
