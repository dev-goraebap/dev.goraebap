import { Avatar } from '@astryxdesign/core/Avatar';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { ListItem } from '@astryxdesign/core/List';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { dueText } from '@kit/composites/property/PropertyPill';
import { icon, solarIcon } from '@kit/foundations/icons/solar-icon';
import { dateText, isOverdue, NONE, people, priorities, priorityOf, statusOf, statuses, today, type Issue, type IssuePriority, type IssueStatus } from './model';
import styles from './issue.module.css';

/** 상태: 색 점과 이름. 점은 장식이라 이름만 읽힌다. isCompact는 점만(이름은 접근 가능한 이름으로 남는다). */
export function StatusMark({ status, isCompact = false }: { status: IssueStatus; isCompact?: boolean }) {
  const value = statusOf(status);
  if (isCompact) return <StatusDot variant={value.dot} label={value.label} />;
  return <HStack className={styles.status} gap={1.5} vAlign="center">
    <span aria-hidden="true"><StatusDot variant={value.dot} label={value.label} /></span>
    <Text type="supporting" maxLines={1} textWrap="nowrap">{value.label}</Text>
  </HStack>;
}

/** 우선순위: 막대 세 칸(긴급은 경고 표시). 이름은 접근 가능한 이름과 title로 남긴다. */
export function PriorityMark({ priority }: { priority: IssuePriority }) {
  const { label, rank } = priorityOf(priority);
  if (priority === 'urgent') return <span className={styles.urgent} role="img" aria-label={`우선순위: ${label}`} title={label}>{icon('alert', true)}</span>;
  return <span className={styles.bars} role="img" aria-label={`우선순위: ${label}`} title={label}>
    {[1, 2, 3].map(step => <i key={step} data-on={step <= rank || undefined} />)}
  </span>;
}

/** 마감일: 아이콘과 날짜. 지났고 끝나지 않았으면 붉게 하되 글자("N일 지남")로도 알린다. */
export function DueDate({ issue }: { issue: Pick<Issue, 'due' | 'status'> }) {
  if (!issue.due) return null;
  const overdue = isOverdue(issue);
  return <HStack gap={1} vAlign="center" className={overdue ? styles.overdue : undefined}>
    <Icon icon={solarIcon('calendar')} size="sm" color={overdue ? 'inherit' : 'secondary'} label="마감일" />
    <Text type="supporting" color={overdue ? 'inherit' : 'secondary'} hasTabularNumbers textWrap="nowrap">
      {overdue ? dueText(issue.due, today) : dateText(issue.due)}
    </Text>
  </HStack>;
}

/** 담당자: 사진과 이름. 지정 안 됨도 같은 자리에 같은 크기로 둔다. onPick이 있으면 누르면 그 사람으로 거른다. */
export function Person({ name, onPick, isCompact = false }: { name?: string; onPick?: (name: string) => void; isCompact?: boolean }) {
  const face = name
    ? <HStack gap={1.5} vAlign="center"><Avatar name={name} size="xsm" shape="circle" />{isCompact ? null : <Text type="supporting" maxLines={1}>{name}</Text>}</HStack>
    : <HStack gap={1.5} vAlign="center"><span className={styles.nobody} aria-hidden="true">{icon('user')}</span>{isCompact ? null : <Text type="supporting" color="secondary" maxLines={1}>지정 안 됨</Text>}</HStack>;
  if (!name) return <span title={isCompact ? '담당자 지정 안 됨' : undefined} aria-label={isCompact ? '담당자 지정 안 됨' : undefined} role={isCompact ? 'img' : undefined}>{face}</span>;
  if (!onPick) return face;
  return <button type="button" className={styles.person} aria-label={`${name}의 이슈만 보기`} title={isCompact ? name : undefined} onClick={() => onPick(name)}>{face}</button>;
}

/**
 * 목록 행: 시작은 우선순위와 키, 제목(한 줄 말줄임). 끝은 늘 있는 값(상태·담당자)을 바깥쪽에, 가끔 있는 값(마감·미리보기)을 안쪽에.
 * 행 전체가 상세로 가는 링크이고 담당자·미리보기는 따로 누른다. 좁으면 상태는 점만, 담당자는 사진만, 미리보기는 뺀다.
 */
export function IssueRow({ issue, isCompact, isPeeking = false, onPeek, onAssignee }: {
  issue: Issue; isCompact: boolean; isPeeking?: boolean; onPeek: (issue: Issue) => void; onAssignee: (name: string) => void;
}) {
  return <ListItem href={`/issues/${issue.id}`} isSelected={isPeeking} data-peek-row={issue.id}
    label={<Text weight="medium" maxLines={1}>{issue.title}</Text>}
    startContent={<HStack gap={2} vAlign="center">
      <PriorityMark priority={issue.priority} />
      <Text className={styles.key} type="supporting" color="secondary" hasTabularNumbers textWrap="nowrap">{issue.id}</Text>
    </HStack>}
    endContent={<HStack className={styles.meta} vAlign="center">
      {isCompact ? null : <IconButton label={`${issue.id} 미리보기`} tooltip="미리보기 (Space)" variant="ghost" size="sm" icon={icon('view', isPeeking)}
        aria-pressed={isPeeking} onClick={() => onPeek(issue)} />}
      {isCompact ? null : <DueDate issue={issue} />}
      <StatusMark status={issue.status} isCompact={isCompact} />
      <Person name={issue.assignee} onPick={onAssignee} isCompact={isCompact} />
    </HStack>} />;
}

/** 보드 카드: 카드 전체가 하나의 링크라 안에 다른 버튼을 두지 않는다. 담당자는 사진만. */
export function IssueCard({ issue }: { issue: Issue }) {
  return <ClickableCard label={`${issue.id} ${issue.title}`} href={`/issues/${issue.id}`} padding={3} className={styles.card} data-peek-row={issue.id}>
    <VStack gap={2}>
      <HStack gap={2} vAlign="center">
        <PriorityMark priority={issue.priority} />
        <Text type="supporting" color="secondary" hasTabularNumbers>{issue.id}</Text>
      </HStack>
      <Text weight="medium" maxLines={2}>{issue.title}</Text>
      <HStack gap={2} hAlign="between" vAlign="center">
        <DueDate issue={issue} />
        <Person name={issue.assignee} isCompact />
      </HStack>
    </VStack>
  </ClickableCard>;
}

/** 속성 알약의 선택지. 값 앞의 표시(점·막대·사진)는 장식이라 이름만 읽힌다. */
export const statusOptions = statuses.map(each => ({ value: each.id, label: each.label,
  icon: <span aria-hidden="true"><StatusDot variant={each.dot} label={each.label} /></span> }));
export const priorityOptions = priorities.map(each => ({ value: each.id, label: each.label, icon: <span aria-hidden="true"><PriorityMark priority={each.id} /></span> }));
export const assigneeOptions = [
  ...people.map(name => ({ value: name, label: name, icon: <span aria-hidden="true"><Avatar name={name} size="xsm" shape="circle" /></span> })),
  { value: NONE, label: '지정 안 됨' },
];
