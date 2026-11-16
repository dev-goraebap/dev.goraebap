/** 관리 앱의 도메인: 태그·사용자·역할별 권한. 표시 이름과 선택지를 한 곳에 둔다. */
export type TagColor = 'red' | 'orange' | 'green' | 'blue' | 'purple' | 'gray';
export const tagColors: { id: TagColor; label: string }[] = [
  { id: 'red', label: '빨강' }, { id: 'orange', label: '주황' }, { id: 'green', label: '초록' },
  { id: 'blue', label: '파랑' }, { id: 'purple', label: '보라' }, { id: 'gray', label: '회색' },
];
export type Tag = { id: string; name: string; color: TagColor; count: number };
export type TagInput = { name: string; color: TagColor };

export type Role = 'admin' | 'editor' | 'writer' | 'viewer';
export const roles: { id: Role; label: string }[] = [
  { id: 'admin', label: '관리자' }, { id: 'editor', label: '편집자' }, { id: 'writer', label: '작성자' }, { id: 'viewer', label: '열람자' },
];
export const roleLabel = (id: Role) => roles.find(role => role.id === id)?.label ?? id;

export type UserStatus = 'active' | 'invited' | 'inactive';
export const statuses: { id: UserStatus; label: string; color: 'green' | 'yellow' | 'gray' }[] = [
  { id: 'active', label: '사용 중', color: 'green' }, { id: 'invited', label: '초대됨', color: 'yellow' }, { id: 'inactive', label: '비활성', color: 'gray' },
];
export const statusOf = (id: UserStatus) => statuses.find(status => status.id === id) ?? statuses[0];
export type User = { id: string; name: string; email: string; role: Role; status: UserStatus; lastSeen: string | null };

export type FeatureGroup = { id: string; label: string; features: { id: string; label: string }[] };
export const featureGroups: FeatureGroup[] = [
  { id: 'docs', label: '문서', features: [{ id: 'docs.read', label: '문서 보기' }, { id: 'docs.write', label: '문서 작성' }, { id: 'docs.delete', label: '문서 삭제' }] },
  { id: 'issues', label: '이슈', features: [{ id: 'issues.read', label: '이슈 보기' }, { id: 'issues.write', label: '이슈 작성' }, { id: 'issues.assign', label: '담당자 지정' }] },
  { id: 'admin', label: '관리', features: [{ id: 'admin.invite', label: '사용자 초대' }, { id: 'admin.tags', label: '태그 관리' }, { id: 'admin.permissions', label: '권한 설정' }] },
];
/** 역할별로 허용한 기능 id. */
export type Matrix = Record<Role, string[]>;
/** 바꾼 칸의 키. */
export const cellKey = (role: Role, feature: string) => `${role}:${feature}`;
