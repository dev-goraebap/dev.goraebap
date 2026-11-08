import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { useRouter, useRouterState } from '@tanstack/react-router';
import { postTags } from '@/entities/post';
import { SearchTool } from '@/shared/ui/composites/search/SearchTool';
export function BlogTools() {
  const router = useRouter();
  const search = useRouterState({ select: s => s.location.searchStr });
  const query = new URLSearchParams(search);
  const update = (key: string, value: string) => { const next = new URLSearchParams(search); if (value) next.set(key, value); else next.delete(key); void router.navigate({ href: `/blog/${next.size ? `?${next}` : ''}`, replace: true }); };
  return <HStack gap={1} vAlign="center"><SearchTool label="글 검색" placeholder="제목·태그 검색" value={query.get('q') ?? ''} onChange={v => update('q', v)} /><Selector label="주제 필터" isLabelHidden size="sm" width="9rem" value={query.get('tag') ?? ''} options={[{ value: '', label: '모든 주제' }, ...postTags.map(value => ({ value, label: value }))]} onChange={v => update('tag', v)} /></HStack>;
}
