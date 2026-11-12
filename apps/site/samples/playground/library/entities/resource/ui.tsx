import { PersonAvatar as Avatar } from '@/shared/ui/foundations/avatar/PersonAvatar';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { icon, solarIcon } from '@/shared/ui/foundations/icons/solar-icon';
import { collectionName, dateText, kindOf, type Resource } from './model';
import styles from './resource.module.css';

/** 사람은 사진과 이름을 함께 둔다. 누르면 그 사람으로 거르며, 행을 여는 링크와 따로 동작한다. */
export function Person({ name, onPick, isCompact = false }: { name: string; onPick?: (name: string) => void; isCompact?: boolean }) {
  const face = <HStack gap={1.5} vAlign="center"><Avatar name={name} size="xsm" shape="circle" />{isCompact ? null : <Text type="supporting" maxLines={1}>{name}</Text>}</HStack>;
  if (!onPick) return face;
  return <button type="button" className={styles.person} aria-label={`${name}의 자료만 보기`} title={isCompact ? name : undefined} onClick={() => onPick(name)}>{face}</button>;
}

/** 줄 끝의 날짜는 아이콘과 이름으로 찾을 수 있게 하고 자리수를 맞춘다. */
export function RowDate({ value }: { value: string }) {
  return <HStack gap={1} vAlign="center">
    <Icon icon={solarIcon('calendar')} size="sm" color="secondary" label="수정일" />
    <Text type="supporting" color="secondary" hasTabularNumbers textWrap="nowrap">{dateText(value)}</Text>
  </HStack>;
}

/**
 * 목록 행: 시작은 종류 표시, 제목(한 줄 말줄임)과 요약, 끝은 즐겨찾기 다음 늘 있는 값(컬렉션·작성자·날짜)을 바깥쪽에.
 * 행 전체가 상세로 가는 링크이고 컬렉션·작성자·별은 따로 누른다. 좁으면 요약과 날짜를 빼고 작성자는 사진만.
 */
export function ResourceRow({ resource, isCompact, isPeeking = false, onStar, onAuthor, onPeek }: {
  resource: Resource; isCompact: boolean; isPeeking?: boolean; onStar: (resource: Resource) => void; onAuthor: (name: string) => void;
  /** 작업 목록의 미리보기: 행 클릭은 페이지, 미리보기는 행 끝 버튼과 Space 키(데스크톱). */
  onPeek?: (resource: Resource) => void;
}) {
  const kind = kindOf(resource.kind);
  return <ListItem href={`/resources/${resource.id}`} isSelected={isPeeking} data-peek-row={resource.id}
    label={<Text weight="medium" maxLines={1}>{resource.title}</Text>}
    description={isCompact ? undefined : <Text color="secondary" maxLines={1}>{resource.summary}</Text>}
    startContent={<span className={styles.kind} title={kind.label}>{icon(kind.icon)}</span>}
    endContent={<HStack className={styles.meta} vAlign="center">
      {onPeek && !isCompact ? <IconButton label={`${resource.title} 미리보기`} tooltip="미리보기 (Space)" variant="ghost" size="sm" icon={icon('view', isPeeking)}
        aria-pressed={isPeeking} onClick={() => onPeek(resource)} /> : null}
      <IconButton label={resource.starred ? '즐겨찾기 해제' : '즐겨찾기'} variant="ghost" size="sm" icon={icon('star', resource.starred)}
        aria-pressed={resource.starred} onClick={() => onStar(resource)} />
      {isCompact ? null : <span className={styles.limit}><Token label={collectionName(resource.collection)} size="sm" href={`/resources?collection=${resource.collection}`} /></span>}
      <Person name={resource.author} onPick={onAuthor} isCompact={isCompact} />
      {isCompact ? null : <RowDate value={resource.updatedAt} />}
    </HStack>} />;
}

const sourceOf = (resource: Resource) => {
  if (resource.kind !== 'link') return resource.kind === 'document' ? '읽고 남기는 기록' : '형태와 색의 기록';
  try { return resource.url ? new URL(resource.url).hostname : '웹 자료'; } catch { return '웹 자료'; }
};

/** 카드 위쪽의 종이: 종류별 바탕 위에 문서 한 장이 기울어 꽂혀 있는 모습. 장식이라 읽기 도구에서는 숨긴다. */
export function ResourcePaper({ resource }: { resource: Resource }) {
  return <div className={styles.preview} data-kind={resource.kind} aria-hidden="true">
    <div className={styles.paper}>
      {icon(kindOf(resource.kind).icon)}
      <span className={styles.source}>{sourceOf(resource)}</span>
      <strong className={styles.paperTitle}>{resource.title}</strong>
      <span className={styles.lines}><i /><i /><i /></span>
    </div>
  </div>;
}

/** 그리드 카드: 카드 전체가 하나의 링크라 안에 다른 버튼을 두지 않는다. 그림자 없이 면과 선으로 구분한다. */
export function ResourceCard({ resource }: { resource: Resource }) {
  const kind = kindOf(resource.kind);
  return <ClickableCard label={resource.title} href={`/resources/${resource.id}`} padding={0} className={styles.card}>
    <ResourcePaper resource={resource} />
    <VStack gap={2} padding={4}>
      <HStack gap={1.5} vAlign="center"><span className={styles.kind}>{icon(kind.icon)}</span><Text type="supporting" color="secondary">{kind.label} · {collectionName(resource.collection)}</Text></HStack>
      <Text weight="semibold" maxLines={2}>{resource.title}</Text>
      <Text color="secondary" maxLines={2}>{resource.summary}</Text>
      <HStack gap={2} hAlign="between" vAlign="center"><Person name={resource.author} /><RowDate value={resource.updatedAt} /></HStack>
    </VStack>
  </ClickableCard>;
}
