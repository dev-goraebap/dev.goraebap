import { ROOT, type FolderNode } from '../entities/node';

const folder = (id: string, parentId: string, name: string, updatedAt: string): FolderNode => ({ id, parentId, name, kind: 'folder', updatedAt });
const file = (id: string, parentId: string, name: string, type: 'document' | 'image', size: number, updatedAt: string): FolderNode =>
  ({ id, parentId, name, kind: 'file', type, size, updatedAt });

/** 폴더 나무 세 단계. "보관함"은 비어 있다. */
export const seedNodes: FolderNode[] = [
  { id: ROOT, parentId: null, name: '내 폴더', kind: 'folder', updatedAt: '2026-11-08' },
  folder('docs', ROOT, '문서', '2026-11-06'),
  folder('design', 'docs', '디자인', '2026-11-05'),
  folder('icons', 'design', '아이콘', '2026-10-28'),
  folder('notes', 'docs', '회의록', '2026-11-06'),
  folder('photos', ROOT, '사진', '2026-10-30'),
  folder('trip', 'photos', '부산 여행', '2026-10-30'),
  folder('projects', ROOT, '프로젝트', '2026-11-07'),
  folder('archive', ROOT, '보관함', '2026-09-12'),
  file('f01', ROOT, '올해 목표.docx', 'document', 48_000, '2026-01-04'),
  file('f02', 'docs', '업무 인수인계.pdf', 'document', 820_000, '2026-11-02'),
  file('f03', 'docs', '독서 메모.docx', 'document', 31_000, '2026-10-21'),
  file('f04', 'design', '화면 구성 초안.pdf', 'document', 2_400_000, '2026-11-05'),
  file('f05', 'design', '색 기준표.docx', 'document', 64_000, '2026-11-01'),
  file('f06', 'design', '로고 시안.png', 'image', 1_300_000, '2026-10-17'),
  file('f07', 'icons', '아이콘 모음.png', 'image', 540_000, '2026-10-28'),
  file('f08', 'notes', '11월 첫째 주 회의.docx', 'document', 22_000, '2026-11-06'),
  file('f09', 'notes', '10월 회고.docx', 'document', 27_000, '2026-10-30'),
  file('f10', 'trip', '해운대.jpg', 'image', 3_800_000, '2026-10-30'),
  file('f11', 'trip', '광안대교 야경.jpg', 'image', 4_200_000, '2026-10-30'),
  file('f12', 'trip', '숙소 예약 확인.pdf', 'document', 96_000, '2026-10-12'),
  file('f13', 'photos', '프로필 사진.jpg', 'image', 910_000, '2026-08-14'),
  file('f14', 'projects', '분기 계획.docx', 'document', 71_000, '2026-11-07'),
  file('f15', 'projects', '일정 정리.pdf', 'document', 280_000, '2026-11-03'),
];
