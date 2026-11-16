import type { Matrix, Tag, User } from '../entities/admin';

export const seedTags: Tag[] = [
  { id: 'tag-design', name: '디자인', color: 'purple', count: 24 },
  { id: 'tag-dev', name: '개발', color: 'blue', count: 41 },
  { id: 'tag-plan', name: '기획', color: 'green', count: 17 },
  { id: 'tag-urgent', name: '긴급', color: 'red', count: 6 },
  { id: 'tag-bug', name: '버그', color: 'orange', count: 12 },
  { id: 'tag-doc', name: '문서', color: 'gray', count: 9 },
  { id: 'tag-meeting', name: '회의', color: 'blue', count: 0 },
  { id: 'tag-idea', name: '아이디어', color: 'green', count: 3 },
];

export const seedUsers: User[] = [
  { id: 'u-seoyun', name: '서윤', email: 'seoyun@example.com', role: 'admin', status: 'active', lastSeen: '2026-11-07T09:12:00+09:00' },
  { id: 'u-jiwoo', name: '지우', email: 'jiwoo@example.com', role: 'editor', status: 'active', lastSeen: '2026-11-07T08:40:00+09:00' },
  { id: 'u-dohyun', name: '도현', email: 'dohyun@example.com', role: 'editor', status: 'active', lastSeen: '2026-11-06T18:05:00+09:00' },
  { id: 'u-minjun', name: '민준', email: 'minjun@example.com', role: 'writer', status: 'active', lastSeen: '2026-11-06T11:30:00+09:00' },
  { id: 'u-haeun', name: '하은', email: 'haeun@example.com', role: 'writer', status: 'active', lastSeen: '2026-11-05T15:22:00+09:00' },
  { id: 'u-yejun', name: '예준', email: 'yejun@example.com', role: 'viewer', status: 'active', lastSeen: '2026-11-04T10:00:00+09:00' },
  { id: 'u-jimin', name: '지민', email: 'jimin@example.com', role: 'writer', status: 'invited', lastSeen: null },
  { id: 'u-sua', name: '수아', email: 'sua@example.com', role: 'viewer', status: 'invited', lastSeen: null },
  { id: 'u-siwoo', name: '시우', email: 'siwoo@example.com', role: 'viewer', status: 'active', lastSeen: '2026-10-29T13:45:00+09:00' },
  { id: 'u-yunseo', name: '윤서', email: 'yunseo@example.com', role: 'writer', status: 'inactive', lastSeen: '2026-09-14T17:10:00+09:00' },
  { id: 'u-chaewon', name: '채원', email: 'chaewon@example.com', role: 'editor', status: 'active', lastSeen: '2026-11-07T07:58:00+09:00' },
  { id: 'u-juwon', name: '주원', email: 'juwon@example.com', role: 'viewer', status: 'inactive', lastSeen: '2026-08-02T09:30:00+09:00' },
  { id: 'u-daeun', name: '다은', email: 'daeun@example.com', role: 'writer', status: 'active', lastSeen: '2026-11-03T16:48:00+09:00' },
  { id: 'u-seojun', name: '서준', email: 'seojun@example.com', role: 'viewer', status: 'active', lastSeen: '2026-11-01T12:15:00+09:00' },
];

const all = ['docs.read', 'docs.write', 'docs.delete', 'issues.read', 'issues.write', 'issues.assign', 'admin.invite', 'admin.tags', 'admin.permissions'];
export const seedMatrix: Matrix = {
  admin: all,
  editor: ['docs.read', 'docs.write', 'docs.delete', 'issues.read', 'issues.write', 'issues.assign', 'admin.tags'],
  writer: ['docs.read', 'docs.write', 'issues.read', 'issues.write'],
  viewer: ['docs.read', 'issues.read'],
};
