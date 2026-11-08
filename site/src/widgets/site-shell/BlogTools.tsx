import { HStack } from '@astryxdesign/core/HStack';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { postTags } from '@/entities/post';
import { SearchTool } from '@/shared/ui/composites/search/SearchTool';
import { useFilters } from '@/shared/ui/composites/filter/use-filters';
export function BlogTools() {
  const router = useRouter();
  const search = useRouterState({ select: s => s.location.searchStr });
  const query = new URLSearchParams(search);
  const update = (key: string, values: string[]) => {
    const next = new URLSearchParams(search);
    next.delete(key);
    for (const value of values) if (value) next.append(key, value);
    void router.navigate({ href: `/blog/${next.size ? `?${next}` : ''}`, replace: true });
  };
  const filter = useFilters([{ key: 'tag', label: '태그', icon: 'tag', isMultiple: true, isSearchable: true, options: postTags.map(value => ({ value, label: value })) }], { state: { tag: query.getAll('tag') }, onStateChange: state => update('tag', state.tag ?? []) });
  return <HStack gap={1} vAlign="center"><SearchTool label="글 검색" placeholder="제목·태그 검색" value={query.get('q') ?? ''} onChange={value => update('q', [value])} />{filter.tools}</HStack>;
}
