import type { Approval } from '../entities/approval';

/** 서윤이 낸 신청 셋(진행 중·승인·반려)과 서윤의 결재를 기다리는 신청 둘. */
export const seedApprovals: Approval[] = [
  {
    id: 'AP-5', kind: 'annual', applicant: '서윤', start: '2026-11-19', end: '2026-11-20', createdAt: '2026-11-06T09:10:00Z',
    reason: '가족 행사로 이틀 쉬려고 합니다. 업무는 휴가 전날까지 인수인계 문서에 정리해 두겠습니다.',
    line: [
      { approver: '지우', role: '팀장', state: 'approved', at: '2026-11-07T10:30:00Z', opinion: '일정 확인했습니다. 다녀오세요.' },
      { approver: '도현', role: '본부장', state: 'pending' },
    ],
  },
  {
    id: 'AP-4', kind: 'annual', applicant: '서윤', start: '2026-11-12', end: '2026-11-12', createdAt: '2026-11-02T14:00:00Z',
    reason: '병원 진료가 있어 하루 쉽니다.',
    line: [
      { approver: '지우', role: '팀장', state: 'approved', at: '2026-11-02T15:20:00Z' },
      { approver: '도현', role: '본부장', state: 'approved', at: '2026-11-03T09:05:00Z', opinion: '승인합니다.' },
    ],
  },
  {
    id: 'AP-3', kind: 'sick', applicant: '서윤', start: '2026-10-28', end: '2026-10-29', createdAt: '2026-10-27T08:40:00Z',
    reason: '감기와 고열로 이틀 쉽니다.',
    line: [
      { approver: '지우', role: '팀장', state: 'rejected', at: '2026-10-27T11:00:00Z', opinion: '진단서를 첨부해 다시 신청해 주세요.' },
      { approver: '도현', role: '본부장', state: 'pending' },
    ],
  },
  {
    id: 'AP-8', kind: 'annual', applicant: '민준', start: '2026-11-24', end: '2026-11-26', createdAt: '2026-11-07T16:20:00Z',
    reason: '여름에 미룬 여행을 다녀오려고 합니다. 24일 오전까지 맡은 배포는 마치고 떠납니다.',
    line: [
      { approver: '서윤', role: '선임', state: 'pending' },
      { approver: '지우', role: '팀장', state: 'pending' },
      { approver: '도현', role: '본부장', state: 'pending' },
    ],
  },
  {
    id: 'AP-9', kind: 'family', applicant: '하은', start: '2026-11-13', end: '2026-11-13', createdAt: '2026-11-08T07:50:00Z',
    reason: '가까운 가족의 결혼식에 참석합니다.',
    line: [
      { approver: '서윤', role: '선임', state: 'pending' },
      { approver: '도현', role: '본부장', state: 'pending' },
    ],
  },
];
