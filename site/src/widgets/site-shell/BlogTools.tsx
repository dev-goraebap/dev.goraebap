import { HStack } from '@astryxdesign/core/HStack';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { postTags, readPostSearch, postSearchHref } from '@/entities/post';
import { SearchTool } from '@/shared/ui/composites/search/SearchTool';
import { useFilters } from '@/shared/ui/composites/filter/use-filters';
export function BlogTools() {
  const router = useRouter();
  const search = useRouterState({ select: s => s.location.searchStr });
  const { q, tags } = readPostSearch(search);
  const update = (key: string, values: string[]) => {
    void router.navigate({ href: postSearchHref(search, key, values), replace: true });
  };
  const filter = useFilters([{ key: 'tag', label: '태그', icon: 'tag', isMultiple: true, isSearchable: true, options: postTags.map(value => ({ value, label: value })) }], { state: { tag: tags }, onStateChange: state => update('tag', state.tag ?? []) });
  return <HStack gap={1} vAlign="center"><SearchTool label="글 검색" placeholder="제목·태그 검색" value={q} onChange={value => update('q', [value])} />{filter.tools}</HStack>;
}
