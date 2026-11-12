import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { useAddressChoices, useAddressFilters, useAddressWords } from '@/shared/lib/list-address';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Alert, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { DisplayChoice, DisplayMenu } from '@/shared/ui/display-menu';
import { FilterBar, FilterChips, FilterMenu, useFilters } from '@/shared/ui/filter';
import { ChevronDownIcon, FolderIcon, LibraryIcon, TriangleAlertIcon } from '@/shared/ui/icon';
import { ListGroupHeader } from '@/shared/ui/list-group-header';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { RowLink } from '@/shared/ui/row-link';
import { SearchTool } from '@/shared/ui/search-tool';
import { Spinner } from '@/shared/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { collectionName, collections, kindOf, kinds, resourceKeys, resourceQueries, useResourceApi, type Resource } from '../../entities/resource';
import { Person, ResourceCard, ResourceRow, RowDate } from '../../entities/resource/ui';
import { allowedDisplay, directions, filterKeys, filters as filterDefs, groups, initialDisplay, layouts, sorts, validateLibrarySearch, visibleResources,
  type Display } from './model';

const PAGE = 6;

/**
 * 서가 목록. 머리 줄: 경로 · 만들기, 툴바: 찾기 · 필터 · 표시. 걸린 필터는 툴바 아래 줄(휴대폰은 칩)에 보인다.
 * 확정 조건(찾는 말 · 필터 · 표시)은 모두 주소가 가진다(키트 list-address: 기록을 쌓지 않고 기본값은 주소에서 뺀다).
 * 상태 순서: 대기(읽기용 이름이 있는 표시) → 실패(다시 시도) → 조건이 있는 0건(검색 결과 없음 + 조건 지우기) → 0건(빈 서가 + 만들기).
 * 재조회 실패가 이미 보이는 목록을 덮지 않는다.
 */
export function LibraryPage({ onCreate }: { onCreate: () => void }) {
  const api = useResourceApi();
  const client = useQueryClient();
  const isMobile = useIsMobile();
  const search = validateLibrarySearch(useLocation().search as Record<string, unknown>);
  const [words, setWords] = useAddressWords('q');
  const [state, setState] = useAddressFilters(filterKeys);
  const [display, setDisplay] = useAddressChoices<Display>(initialDisplay, allowedDisplay);
  const filters = useFilters(filterDefs, { state, onStateChange: setState });
  const [limit, setLimit] = useState(PAGE);
  const query = useQuery(resourceQueries.all(api));
  const star = useMutation({
    mutationFn: (resource: Resource) => api.update(resource.id, { starred: !resource.starred }),
    onSettled: () => client.invalidateQueries({ queryKey: resourceKeys.all }),
  });
  const items = visibleResources(query.data ?? [], { ...search, q: words }, state, display);
  const hasConditions = !!words.trim() || filters.active.length > 0;
  // 필터는 바로, 찾는 말은 입력과 같은 경로(잠시 뒤)로 주소에서 뺀다. 주소 쓰기는 부를 때의 주소를 읽어 앞의 변경을 덮지 않는다.
  const clearConditions = () => { setWords(''); filters.clear(); };
  const place = search.starred ? '즐겨찾기' : search.collection ? collectionName(search.collection) : '모든 자료';
  // 휴대폰에는 표가 없다(같은 줄 목록으로 보인다).
  const layout = isMobile && display.layout === 'table' ? 'list' : display.layout;
  const isTweaked = (Object.keys(initialDisplay) as (keyof Display)[]).some(key => display[key] !== initialDisplay[key]);
  const content = (): ReactNode => {
    if (query.isPending) return <div className="flex flex-1 items-center justify-center"><Spinner aria-label="자료를 불러오는 중" className="size-6 text-muted-foreground" /></div>;
    if (query.isError && !query.data) return <PageState kind="error" title="자료를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    if (items.length === 0 && hasConditions) return <PageState kind="search" title="조건에 맞는 자료가 없습니다" description="검색어나 필터를 바꿔 보세요."
      action={<Button variant="secondary" onClick={clearConditions}>조건 지우기</Button>} />;
    if (items.length === 0) return <PageState kind="empty" title={search.starred ? '즐겨찾기한 자료가 없습니다' : '아직 자료가 없습니다'}
      description={search.starred ? '자료의 별을 눌러 모아 두세요.' : '읽을 자료나 남길 기록을 추가해 보세요.'}
      action={search.starred ? undefined : <Button variant="secondary" onClick={onCreate}>자료 추가</Button>} />;
    const sections = display.group === 'kind' ? kinds.map(kind => ({ id: kind.id, label: kind.label, mark: <kind.icon className="text-icon-muted" />, rows: items.filter(item => item.kind === kind.id) }))
      : display.group === 'collection' ? collections.map(each => ({ id: each.id, label: each.name, mark: <FolderIcon className="text-icon-muted" />, rows: items.filter(item => item.collection === each.id) }))
      : [{ id: 'all', label: '', mark: null, rows: items }];
    let left = limit;
    return <div className="mx-auto flex w-full max-w-288 flex-col">
      {sections.filter(section => section.rows.length > 0).map(section => {
        const rows = section.rows.slice(0, Math.max(left, 0));
        left -= rows.length;
        return <Group key={section.id} label={section.label} mark={section.mark} count={section.rows.length} isGrouped={display.group !== 'none'}>
          {rows.length ? <Rows layout={layout} rows={rows} isCompact={isMobile}
            onStar={resource => star.mutate(resource)} onAuthor={name => setState({ ...state, author: [name] })} /> : null}
        </Group>;
      })}
      <div className="flex flex-col items-center gap-3 px-4 py-8 text-sm text-muted-foreground">
        <span className="tabular-nums">{Math.min(limit, items.length)} / {items.length}</span>
        {limit < items.length
          ? <Button variant="secondary" className="max-md:h-11" onClick={() => setLimit(limit + PAGE)}><ChevronDownIcon data-icon="inline-start" />문서 더 보기</Button>
          : <span>모두 확인했습니다</span>}
      </div>
    </div>;
  };
  return <Page crumbs={[{ label: '서가', href: '/resources', icon: LibraryIcon }, { label: place }]}
    tools={<>
      <SearchTool label="자료 검색" placeholder="제목과 요약에서 찾기" value={words} onChange={setWords} />
      <FilterMenu filters={filters} />
      <DisplayMenu isTweaked={isTweaked} onReset={() => setDisplay(initialDisplay)}>
        <DisplayChoice title="보기" items={layouts} value={display.layout} onChange={value => setDisplay({ ...display, layout: value })} />
        <DisplayChoice title="정렬" items={sorts} value={display.sort} onChange={value => setDisplay({ ...display, sort: value })} />
        <DisplayChoice title="방향" items={directions} value={display.direction} onChange={value => setDisplay({ ...display, direction: value })} />
        <DisplayChoice title="묶기" items={groups} value={display.group} onChange={value => setDisplay({ ...display, group: value })} />
      </DisplayMenu>
    </>}
    below={<>
      {isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />}
      {star.isError ? <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
        <TriangleAlertIcon /><AlertTitle>즐겨찾기를 바꾸지 못했습니다. 잠시 후 다시 눌러 주세요.</AlertTitle>
      </Alert> : null}
    </>}
    create={{ label: '자료 추가', onClick: onCreate }}>
    {content()}
  </Page>;
}

/** 묶음: 묶지 않으면 그대로, 묶으면 접히는 머리(키트 ListGroupHeader) 아래에 둔다. 접힘은 화면 상태라 주소에 두지 않는다. */
function Group({ label, mark, count, isGrouped, children }: { label: string; mark: ReactNode; count: number; isGrouped: boolean; children: ReactNode }) {
  const [isOpen, setOpen] = useState(true);
  if (!isGrouped) return children;
  return <section aria-label={label}>
    <ListGroupHeader label={label} icon={mark} count={count} isOpen={isOpen} onToggle={() => setOpen(!isOpen)} />
    {isOpen ? children : null}
  </section>;
}

function Rows({ layout, rows, isCompact, onStar, onAuthor }: {
  layout: Display['layout']; rows: Resource[]; isCompact: boolean; onStar: (resource: Resource) => void; onAuthor: (name: string) => void;
}) {
  if (layout === 'grid') return <ul aria-label="자료" className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3 p-4">
    {rows.map(resource => <li key={resource.id}><ResourceCard resource={resource} /></li>)}
  </ul>;
  if (layout === 'table') return <Table aria-label="자료" className="table-fixed bg-background">
    <TableHeader className="sticky top-0 z-10 bg-background">
      <TableRow className="hover:bg-transparent">
        <TableHead className="h-11 pl-4 text-muted-foreground">제목</TableHead>
        <TableHead className="w-22 text-muted-foreground">종류</TableHead>
        <TableHead className="w-30 text-muted-foreground">컬렉션</TableHead>
        <TableHead className="w-30 text-muted-foreground">작성자</TableHead>
        <TableHead className="w-30 pr-4 text-right text-muted-foreground">수정일</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(row => <TableRow key={row.id} className="relative bg-background hover:bg-row-hover">
        <TableCell className="h-12 truncate pl-4 compact:h-10"><RowLink to={`/resources/${row.id}` as string} className="font-medium">{row.title}</RowLink></TableCell>
        <TableCell>{kindOf(row.kind).label}</TableCell>
        <TableCell className="truncate">{collectionName(row.collection)}</TableCell>
        <TableCell><Person name={row.author} onPick={onAuthor} /></TableCell>
        <TableCell className="pr-4"><span className="flex justify-end"><RowDate value={row.updatedAt} /></span></TableCell>
      </TableRow>)}
    </TableBody>
  </Table>;
  return <ul aria-label="자료" className="flex flex-col">
    {rows.map(resource => <ResourceRow key={resource.id} resource={resource} isCompact={isCompact} onStar={onStar} onAuthor={onAuthor} />)}
  </ul>;
}
