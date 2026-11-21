import { DisplayChoice, DisplayMenu } from '@/shared/ui/kit/display-menu';

type SortKey = 'custom' | 'name' | 'members';
export type ProjectDisplay = { sort: SortKey; direction: 'asc' | 'desc' };
export const INITIAL_PROJECT_DISPLAY: ProjectDisplay = { sort: 'custom', direction: 'asc' };

const SORTS: { value: SortKey; label: string; kind: 'rank' | 'text' }[] = [
  { value: 'custom', label: '사용자 지정', kind: 'rank' }, { value: 'name', label: '이름', kind: 'text' }, { value: 'members', label: '멤버 수', kind: 'rank' },
];
const DIRECTIONS = { rank: ['앞 → 뒤', '뒤 → 앞'], text: ['가 → 하', '하 → 가'] } as const;

export function ProjectDisplayMenu({ value, onChange }: { value: ProjectDisplay; onChange: (value: ProjectDisplay) => void }) {
  const [asc, desc] = DIRECTIONS[SORTS.find(sort => sort.value === value.sort)?.kind ?? 'rank'];
  return (
    <DisplayMenu isTweaked={value.sort !== INITIAL_PROJECT_DISPLAY.sort || value.direction !== INITIAL_PROJECT_DISPLAY.direction} onReset={() => onChange(INITIAL_PROJECT_DISPLAY)}>
      <DisplayChoice title="정렬 기준" items={SORTS} value={value.sort} onChange={sort => onChange({ ...value, sort })} />
      <DisplayChoice title="방향" items={[{ value: 'asc', label: asc }, { value: 'desc', label: desc }] as const} value={value.direction}
        onChange={direction => onChange({ ...value, direction })} />
    </DisplayMenu>
  );
}
