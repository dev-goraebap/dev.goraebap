/**
 * What each kind of notice is, as the server sends it (IssueService): when it goes, to whom, whose avatar it shows,
 * where it opens and which push group a member may turn off it under. The words and the links are the server's; this
 * only describes them, so a change there is written here too.
 */
export type NoticeKind = {
  kind: string;
  when: string;
  to: string;
  from: string;
  opens: string;
  pushGroup: string;
};

export const NOTICE_KINDS: readonly NoticeKind[] = [
  {
    kind: 'ISSUE_ASSIGNED',
    when: '업무의 담당자가 바뀌었을 때 (스스로 맡은 경우는 빼고)',
    to: '새 담당자',
    from: '담당자를 바꾼 사람',
    opens: '그 업무',
    pushGroup: '업무',
  },
];
