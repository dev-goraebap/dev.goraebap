import type { CalendarEvent } from '../entities/event';

/** 예제의 "오늘"(2026-11-08)을 둘러싼 한 달 남짓. 11월 12일은 일정이 넘쳐 "+3"으로 묶인다. */
export const seedEvents: CalendarEvent[] = [
  { id: 'e01', title: '디자인 리뷰', start: '2026-10-30', end: '2026-10-30', time: '14:00', place: '3층 회의실', color: 'blue' },
  { id: 'e02', title: '디자인 리뷰', start: '2026-11-03', end: '2026-11-03', time: '14:00', place: '3층 회의실', color: 'blue' },
  { id: 'e03', title: '팀 워크숍', start: '2026-11-04', end: '2026-11-06', place: '양평 연수원', color: 'green' },
  { id: 'e04', title: '가족 모임', start: '2026-11-08', end: '2026-11-08', time: '18:00', place: '본가', color: 'green' },
  { id: 'e05', title: '주간 회의', start: '2026-11-09', end: '2026-11-09', time: '10:00', place: '화상 회의', color: 'blue' },
  { id: 'e06', title: '부산 출장', start: '2026-11-09', end: '2026-11-12', place: '부산 센텀', color: 'orange' },
  { id: 'e07', title: '배포 점검', start: '2026-11-10', end: '2026-11-10', time: '15:00', color: 'purple' },
  { id: 'e08', title: '고객 인터뷰', start: '2026-11-12', end: '2026-11-12', time: '09:30', place: '화상 회의', color: 'blue' },
  { id: 'e09', title: '문서 정리', start: '2026-11-12', end: '2026-11-12', time: '11:00', color: 'purple' },
  { id: 'e10', title: '스프린트 회고', start: '2026-11-12', end: '2026-11-12', time: '14:00', place: '3층 회의실', color: 'blue' },
  { id: 'e11', title: '코드 리뷰', start: '2026-11-12', end: '2026-11-12', time: '16:00', color: 'purple' },
  { id: 'e12', title: '저녁 모임', start: '2026-11-12', end: '2026-11-12', time: '19:00', place: '합정역', color: 'green' },
  { id: 'e13', title: '분기 계획', start: '2026-11-16', end: '2026-11-17', place: '본사 대회의실', color: 'orange' },
  { id: 'e14', title: '디자인 시스템 공유', start: '2026-11-20', end: '2026-11-20', time: '13:00', color: 'blue' },
  { id: 'e15', title: '연차', start: '2026-11-25', end: '2026-11-25', color: 'orange' },
  { id: 'e16', title: '월말 정산', start: '2026-11-27', end: '2026-11-27', time: '17:00', color: 'purple' },
  { id: 'e17', title: '연말 일정 조율', start: '2026-12-01', end: '2026-12-01', time: '10:00', color: 'blue' },
];
