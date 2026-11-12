import { useRouter, useRouterState } from '@tanstack/react-router';
import { postSearchHref, postTags, readPostSearch } from '@/entities/post';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { FilterBar, FilterMenu, useFilters } from '@/shared/ui/filter';
import { TagIcon } from '@/shared/ui/icon';
import { SearchTool } from '@/shared/ui/search-tool';

const tagFilter = [{ key: 'tag' as const, label: '태그', icon: TagIcon, isSearchable: true, options: postTags.map(value => ({ value, label: value })) }];

/**
 * 블로그 목록의 툴바 도구(찾기 · 태그 필터)와 툴바 아래 걸린 필터 줄. 찾는 말과 태그는 주소(?q= · ?tag=)에 두어 공유 · 뒤로 가기가
 * 그대로 된다. 걸린 필터 줄은 데스크톱에만 둔다(휴대폰은 필터 시트가 고른 값을 보인다).
 */
export function useBlogTools() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const search = useRouterState({ select: state => state.location.searchStr });
  const { q, tags } = readPostSearch(search);
  const update = (key: string, values: string[]) => { void router.navigate({ href: postSearchHref(search, key, values), replace: true }); };
  const filters = useFilters(tagFilter, { state: { tag: tags }, onStateChange: state => update('tag', state.tag ?? []) });
  return {
    tools: <>
      <SearchTool label="글 검색" placeholder="제목 · 태그 검색" value={q} onChange={value => update('q', value ? [value] : [])} />
      <FilterMenu filters={filters} />
    </>,
    below: isMobile ? undefined : <FilterBar filters={filters} />,
  };
}
