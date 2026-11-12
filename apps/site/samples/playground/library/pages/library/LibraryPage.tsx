import styles from './library.module.css';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Grid } from '@astryxdesign/core/Grid';
import { Link } from '@astryxdesign/core/Link';
import { Spinner } from '@astryxdesign/core/Spinner';
import { pixel, proportional } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { DisplayMenu } from '@/shared/ui/composites/filter/DisplayMenu';
import { useFilters } from '@/shared/ui/composites/filter/use-filters';
import { ListGroupHeader } from '@/shared/ui/composites/list-group/ListGroupHeader';
import { SearchTool } from '@/shared/ui/composites/search/SearchTool';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { useIsPhone } from '@/shared/ui/foundations/media';
import { Page } from '@/shared/ui/layouts/page/Page';
import { PageBanner, PageList, PageTable, useOpenRows } from '@/shared/ui/layouts/page/PageParts';
import { useAddressDisplay, useAddressFilters, useAddressWords } from '@/shared/ui/patterns/list/list-address';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { collectionName, collections, kindOf, kinds, resourceKeys, resourceQueries, useResourceApi, type Resource } from '../../entities/resource';
import { Person, ResourceCard, ResourceRow, RowDate } from '../../entities/resource/ui';
import { filters, groups, initialDisplay, layouts, sorts, validateLibrarySearch, visibleResources } from './model';

const PAGE = 6;

/**
 * 서가 목록. 머리 줄: 경로·도구(검색·필터·표시)·만들기. 실제 필터가 있을 때만 적용 줄. 확정 조건은 모두 주소가 가진다.
 * 상태 순서: 대기(라벨 있는 표시) → 실패(다시 시도) → 조건이 있는 0건(검색 결과 없음 + 조건 지우기) → 0건(빈 서가 + 만들기).
 * 재조회 실패에 이미 보이는 목록을 덮지 않는다.
 */
export function LibraryPage({ onCreate }: { onCreate: () => void }) {
  const api = useResourceApi();
  const client = useQueryClient();
  const navigate = useNavigate();
  const isPhone = useIsPhone();
  const search = validateLibrarySearch(useLocation().search as Record<string, unknown>);
  const [words, setWords] = useAddressWords('q');
  const [state, setState] = useAddressFilters(filters);
  const [display, setDisplay] = useAddressDisplay(initialDisplay, { layouts: layouts.map(each => each.id), sorts: sorts.map(each => each.id), groups: groups.map(each => each.id) });
  const list = useFilters(filters, { state, onStateChange: setState });
  const [limit, setLimit] = useState(PAGE);
  // 작업 목록: 행 클릭은 페이지, 미리보기는 행 끝 버튼·Space, 열린 동안 위·아래 키로 옮긴다.

  const query = useQuery(resourceQueries.all(api));
  const star = useMutation({
    mutationFn: (resource: Resource) => api.update(resource.id, { starred: !resource.starred }),
    onSettled: () => client.invalidateQueries({ queryKey: resourceKeys.all }),
  });
  const items = visibleResources(query.data ?? [], { ...search, q: words }, state, display);
  const hasConditions = !!words.trim() || list.count > 0;
  // 필터는 바로, 검색어는 입력과 같은 경로(잠시 뒤)로 주소에서 뺀다. 한 번에 두 번 쓰면 앞의 변경을 덮는다.
  const clearConditions = () => { setWords(''); list.clear(); };
  const place = search.starred ? '즐겨찾기' : search.collection ? collectionName(search.collection) : '모든 자료';
  const layout = isPhone && display.layout === 'table' ? 'list' : display.layout;
  const content = (): ReactNode => {
    if (query.isPending) return <Center height="100%"><Spinner label="자료를 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="자료를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (items.length === 0 && hasConditions) return <PageState kind="search" title="조건에 맞는 자료가 없습니다" description="검색어나 필터를 바꿔 보세요."
      action={<Button label="조건 지우기" variant="secondary" onClick={clearConditions} />} />;
    if (items.length === 0) return <PageState kind="empty" title={search.starred ? '즐겨찾기한 자료가 없습니다' : '아직 자료가 없습니다'}
      description={search.starred ? '자료의 별을 눌러 모아 두세요.' : '읽을 자료나 남길 기록을 추가해 보세요.'}
      action={search.starred ? undefined : <Button label="자료 추가" variant="secondary" icon={icon('plus')} onClick={onCreate} />} />;
    const sections = display.group === 'kind' ? kinds.map(kind => ({ id: kind.id, label: kind.label, mark: icon(kind.icon), rows: items.filter(item => item.kind === kind.id) }))
      : display.group === 'collection' ? collections.map(each => ({ id: each.id, label: each.name, mark: icon('folder'), rows: items.filter(item => item.collection === each.id) }))
      : [{ id: 'all', label: '', mark: null, rows: items }];
    const shown = sections.filter(section => section.rows.length > 0);
    let left = limit;
    return <VStack>
      {shown.map(section => {
        const rows = section.rows.slice(0, Math.max(left, 0));
        left -= rows.length;
        return <Group key={section.id} label={section.label} mark={section.mark} count={section.rows.length} isGrouped={display.group !== 'none'}>
          {rows.length ? <Rows layout={layout ?? 'list'} rows={rows} isPhone={isPhone}
            onStar={resource => star.mutate(resource)} onAuthor={name => setState({ ...state, author: [name] })}
            onOpen={resource => void navigate({ href: `/resources/${resource.id}` })} /> : null}
        </Group>;
      })}
      <div className={styles.more}><Text type="supporting" color="secondary">{Math.min(limit,items.length)} / {items.length}</Text>{limit < items.length ? <Button label="문서 더 보기" variant="secondary" icon={icon('chevron-down')} onClick={()=>setLimit(limit+PAGE)} /> : <Text type="supporting" color="secondary">모두 확인했습니다</Text>}</div>
    </VStack>;
  };
  return <Page crumbs={[{ label: '서가', href: '/resources', icon: 'library' }, { label: place }]}
    tools={<>
      <SearchTool label="자료 검색" placeholder="제목과 요약에서 찾기" value={words} onChange={setWords} />
      {list.tools}
      <DisplayMenu layouts={layouts} sorts={sorts} groups={groups} value={display} initial={initialDisplay} onChange={setDisplay} />
    </>}
    applied={list.applied}
    create={{ label: '자료 추가', onClick: onCreate }}
    >
    {star.isError ? <PageBanner status="error" title="즐겨찾기를 바꾸지 못했습니다" description="잠시 후 다시 눌러 주세요." /> : null}
    <div className={styles.container}>{content()}</div>
  </Page>;
}

function Group({ label, mark, count, isGrouped, children }: { label: string; mark: ReactNode; count: number; isGrouped: boolean; children: ReactNode }) {
  const [isOpen, setOpen] = useState(true);
  if (!isGrouped) return children;
  return <section aria-label={label}>
    <ListGroupHeader label={label} mark={mark} count={count} isOpen={isOpen} onToggle={() => setOpen(!isOpen)} />
    {isOpen ? children : null}
  </section>;
}

function Rows({ layout, rows, isPhone, onStar, onAuthor, onOpen }: {
  layout: string; rows: Resource[]; isPhone: boolean;
  onStar: (resource: Resource) => void; onAuthor: (name: string) => void; onOpen: (resource: Resource) => void;
}) {
  const open = useOpenRows<Resource>(onOpen);
  if (layout === 'grid') return <VStack padding={4}><Grid columns={{ minWidth: 240 }} gap={3}>
    {rows.map(resource => <ResourceCard key={resource.id} resource={resource} />)}
  </Grid></VStack>;
  if (layout === 'table') return <PageTable<Resource> data={rows} hasHover textOverflow="truncate" plugins={open} columns={[
    { key: 'title', header: '제목', width: proportional(1), renderCell: row => <Link href={`/resources/${row.id}`}>{row.title}</Link> },
    { key: 'kind', header: '종류', width: pixel(88), renderCell: row => <Text>{kindOf(row.kind).label}</Text> },
    { key: 'collection', header: '컬렉션', width: pixel(120), renderCell: row => <Text maxLines={1}>{collectionName(row.collection)}</Text> },
    { key: 'author', header: '작성자', width: pixel(120), renderCell: row => <Person name={row.author} onPick={onAuthor} /> },
    { key: 'updatedAt', header: '수정일', width: pixel(120), align: 'end', renderCell: row => <RowDate value={row.updatedAt} /> },
  ]} />;
  return <PageList hasDividers aria-label="자료">
    {rows.map(resource => <ResourceRow key={resource.id} resource={resource} isCompact={isPhone} onStar={onStar} onAuthor={onAuthor} />)}
  </PageList>;
}
