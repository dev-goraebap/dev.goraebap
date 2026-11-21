import type { OrgPerson } from '@/entities/organization';
import type { Project, ProjectRole } from '@/entities/project';

/** 한 사람의 참여: 프로젝트와 그 안의 역할. */
export type JoinedProject = { project: Project; role: ProjectRole };
export type WorkspaceMemberRowData = { person: OrgPerson; projects: JoinedProject[] };
/** 참여 관리 열기: 그 사람의 프로젝트 참여를 관리하는 대화상자를 연다(내가 관리자인 프로젝트가 있을 때만). */
export type ManageMember = (person: OrgPerson) => void;
