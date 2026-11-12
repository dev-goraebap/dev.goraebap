import { Link } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { CalendarIcon, StarIcon } from '@/shared/ui/icon';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { RowLink } from '@/shared/ui/row-link';
import { collectionName, dateText, kindOf, type Resource, type ResourceKind } from './model';

/** 종류 표시: 옅은 칸 안의 종류 아이콘. 이름은 곁의 글이나 title이 전한다. */
export function KindMark({ kind }: { kind: ResourceKind }) {
  const each = kindOf(kind);
  return <span title={each.label} className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-icon-muted"><each.icon /></span>;
}

/** 사람은 사진과 이름을 함께 둔다. 누르면 그 사람으로 거르며, 줄을 여는 링크 위에 떠서 따로 눌린다. */
export function Person({ name, onPick, isCompact = false }: { name: string; onPick?: (name: string) => void; isCompact?: boolean }) {
  const face = <>
    <PersonAvatar name={name} />
    {isCompact ? null : <span className="truncate text-xs">{name}</span>}
  </>;
  if (!onPick) return <span className="flex min-w-0 items-center gap-1.5">{face}</span>;
  return <button type="button" aria-label={`${name}의 자료만 보기`} title={isCompact ? name : undefined} onClick={() => onPick(name)}
    className="relative z-1 flex max-w-24 min-w-0 items-center gap-1.5 rounded-full px-1 py-0.5 outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 max-md:min-h-11">
    {face}
  </button>;
}

/** 줄 끝의 날짜: 아이콘에 읽기용 이름을 두고 자리수를 맞춘다. */
export function RowDate({ value }: { value: string }) {
  return <span className="flex shrink-0 items-center gap-1 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
    <CalendarIcon className="size-3.5" /><span className="sr-only">수정일</span>{dateText(value)}
  </span>;
}

/** 즐겨찾기 별: 줄 위에 떠서 링크와 따로 눌린다. 휴대폰은 44px 자리. */
export function StarButton({ resource, onStar }: { resource: Resource; onStar: (resource: Resource) => void }) {
  return <Button variant="ghost" size="icon-xs" aria-label={resource.starred ? '즐겨찾기 해제' : '즐겨찾기'} aria-pressed={resource.starred}
    className="relative z-1 max-md:size-11" onClick={() => onStar(resource)}>
    <StarIcon chosen={resource.starred} />
  </Button>;
}

/**
 * 목록 줄: 시작은 종류 표시, 제목(한 줄 말줄임)과 요약, 끝은 즐겨찾기 다음 늘 있는 값(컬렉션 · 작성자 · 날짜)을 바깥쪽에.
 * 제목의 RowLink가 줄 전체를 덮어 어디를 눌러도 상세로 가고, 별 · 컬렉션 · 작성자는 그 위에 떠서 따로 눌린다.
 * 좁으면 요약과 날짜를 빼고 작성자는 사진만. 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가린다.
 */
export function ResourceRow({ resource, isCompact, onStar, onAuthor }: {
  resource: Resource; isCompact: boolean; onStar: (resource: Resource) => void; onAuthor: (name: string) => void;
}) {
  return <li className="relative flex min-h-14 items-center gap-3 border-b bg-background px-4 py-2 hover:bg-row-hover compact:min-h-11 compact:py-1 max-md:min-h-16">
    <KindMark kind={resource.kind} />
    <div className="flex min-w-0 flex-1 flex-col">
      <RowLink to={`/resources/${resource.id}` as string} className="truncate font-medium">{resource.title}</RowLink>
      {isCompact ? null : <span className="truncate text-muted-foreground">{resource.summary}</span>}
    </div>
    <div className="flex shrink-0 items-center gap-2.5">
      <StarButton resource={resource} onStar={onStar} />
      {isCompact ? null : <Badge variant="label" className="relative z-1 max-w-28"
        render={<Link to={"/resources" as string} search={{ collection: resource.collection } as never} />}>
        <span className="truncate">{collectionName(resource.collection)}</span>
      </Badge>}
      <Person name={resource.author} onPick={onAuthor} isCompact={isCompact} />
      {isCompact ? null : <RowDate value={resource.updatedAt} />}
    </div>
  </li>;
}

const sourceOf = (resource: Resource) => {
  if (resource.kind !== 'link') return resource.kind === 'document' ? '읽고 남기는 기록' : '형태와 색의 기록';
  try { return resource.url ? new URL(resource.url).hostname : '웹 자료'; } catch { return '웹 자료'; }
};

/** 종류별 바탕: 자료 종류(링크 · 문서 · 그림)를 나누는 데만 쓰는 분류 색(일정 분류 색 토큰). */
const paperTone: Record<ResourceKind, string> = {
  link: 'bg-event-blue text-event-blue-foreground',
  document: 'bg-event-yellow text-event-yellow-foreground',
  image: 'bg-event-green text-event-green-foreground',
};
const paperTilt: Record<ResourceKind, string> = { link: 'rotate-3', document: '-rotate-4', image: '-rotate-6' };

/** 카드 위쪽의 종이: 종류별 바탕 위에 문서 한 장이 기울어 꽂혀 있는 모습. 장식이라 읽기 도구에서는 숨긴다. */
export function ResourcePaper({ resource }: { resource: Resource }) {
  const Mark = kindOf(resource.kind).icon;
  return <div aria-hidden="true" className={cn('relative grid h-40 place-items-center overflow-hidden', paperTone[resource.kind])}>
    <div className={cn('relative top-6 flex h-40 w-[72%] flex-col gap-2 rounded-t-lg border border-background/60 bg-background/60 px-4 pt-5 pb-4', paperTilt[resource.kind])}>
      <Mark className="size-7" />
      <span className="text-[0.5rem] tracking-wide">{sourceOf(resource)}</span>
      <strong className="line-clamp-2 max-w-[90%] text-[0.7rem] leading-relaxed">{resource.title}</strong>
      <span className="flex flex-col gap-1.5">
        <i className="h-0.5 bg-current opacity-15" /><i className="h-0.5 bg-current opacity-15" /><i className="h-0.5 w-2/3 bg-current opacity-15" />
      </span>
    </div>
  </div>;
}

/** 그리드 카드: 제목의 RowLink가 카드 전체를 덮는 하나의 링크라 안에 다른 버튼을 두지 않는다. 그림자 없이 면과 선으로 구분한다. */
export function ResourceCard({ resource }: { resource: Resource }) {
  const kind = kindOf(resource.kind);
  return <article className="relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 [overflow-wrap:anywhere] hover:ring-foreground/20">
    <ResourcePaper resource={resource} />
    <div className="flex flex-col gap-2 p-4">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><KindMark kind={resource.kind} />{kind.label} · {collectionName(resource.collection)}</span>
      <RowLink to={`/resources/${resource.id}` as string} className="line-clamp-2 font-semibold">{resource.title}</RowLink>
      <p className="line-clamp-2 text-muted-foreground">{resource.summary}</p>
      <div className="flex items-center justify-between gap-2"><Person name={resource.author} /><RowDate value={resource.updatedAt} /></div>
    </div>
  </article>;
}
