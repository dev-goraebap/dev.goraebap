import { formatWorkItemDate, priorityMark, type WorkItemPriority, type TimelineEntry } from '@/entities/work-item';

const day = (value?: string) => (value ? formatWorkItemDate(value) : '없음');

/** What an activity on the timeline says, after the name of who did it (client/'s words). */
export function activityText(entry: TimelineEntry): string {
  const { before, after } = entry;
  switch (entry.field) {
    case 'COMMENT_EDITED': return '댓글을 고쳤습니다';
    case 'COMMENT_DELETED': return '댓글을 지웠습니다';
    case 'COMMENT_RESOLVED': return '댓글 스레드를 해결했습니다';
    case 'COMMENT_REOPENED': return '댓글 스레드를 다시 열었습니다';
    case 'CREATED': return '업무를 만들었습니다';
    case 'TITLE': return `제목을 '${after ?? ''}'(으)로 바꿨습니다`;
    case 'TYPE': return `유형을 ${before ?? '없음'}에서 ${after ?? '없음'}(으)로 바꿨습니다`;
    case 'STATUS': return `상태를 ${before ?? '없음'}에서 ${after ?? '없음'}(으)로 옮겼습니다`;
    case 'PRIORITY': return `우선순위를 ${priorityMark(before as WorkItemPriority).label}에서 ${priorityMark(after as WorkItemPriority).label}(으)로 바꿨습니다`;
    case 'ASSIGNEE': return after ? `담당자를 ${after}님으로 정했습니다` : '담당자를 뺐습니다';
    case 'START_DATE': return `시작일을 ${day(after)}(으)로 바꿨습니다`;
    case 'DUE_DATE': return `마감일을 ${day(after)}(으)로 바꿨습니다`;
    case 'PARENT': return after ? `상위 업무를 ${after}(으)로 정했습니다` : '상위 업무에서 뺐습니다';
    case 'LABELS': return after ? `라벨을 ${after}(으)로 바꿨습니다` : '라벨을 모두 뺐습니다';
    case 'ESTIMATE': return after ? `추정시간을 ${after}시간으로 정했습니다` : '추정시간을 비웠습니다';
    case 'STORY_POINTS': return after ? `스토리 포인트를 ${after}(으)로 정했습니다` : '스토리 포인트를 비웠습니다';
    case 'CYCLE': return after ? `사이클을 ${after}(으)로 옮겼습니다` : `${before ?? ''} 사이클에서 뺐습니다`;
    case 'TIME_SPENT': return after ? `${after}시간을 기록했습니다` : `${before ?? ''}시간 기록을 지웠습니다`;
    case 'BODY': return '본문을 고쳤습니다';
    case 'DELETED': return '업무를 지웠습니다';
    default: return '업무를 바꿨습니다';
  }
}

/** The mark of an activity on the timeline's rule: the kind of change it was. */
export function activityIcon(entry: TimelineEntry): string {
  switch (entry.field) {
    case 'CREATED': return 'created';
    case 'STATUS': return 'checklist';
    case 'PRIORITY': return 'priority';
    case 'TYPE': return 'tasks';
    case 'ASSIGNEE': return 'user';
    case 'START_DATE': case 'DUE_DATE': return 'calendar';
    case 'PARENT': return 'branch';
    case 'LABELS': return 'tag';
    case 'ESTIMATE': case 'TIME_SPENT': return 'clock';
    case 'CYCLE': return 'repeat';
    case 'STORY_POINTS': return 'priority';
    case 'BODY': return 'document';
    case 'DELETED': return 'delete';
    default: return 'edit';
  }
}
