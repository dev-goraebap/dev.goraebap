import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import type { ReactNode } from 'react';

export type FilterChip = { key: string; label: string; summary: string; icon?: ReactNode };

export function FilterBar({ filters, onEdit, onRemove, onAdd, onClear }: {
  filters: FilterChip[]; onEdit: (key: string) => void; onRemove: (key: string) => void; onAdd: () => void; onClear: () => void;
}) {
  const isPhone = useMediaQuery('(width < 64rem)');
  return <HStack className="reference-filter-bar" gap={1.5} vAlign="center">
    {filters.map(filter => <HStack key={filter.key} className="reference-filter-chip" gap={0}>
      <Button label={`${filter.label}: ${filter.summary}`} icon={filter.icon} variant="view" onClick={() => onEdit(filter.key)} />
      {!isPhone ? <Button label={`${filter.label} 지우기`} variant="ghost" size="sm" onClick={() => onRemove(filter.key)} /> : null}
    </HStack>)}
    <Button label="필터 추가" variant="view" onClick={onAdd} />
    {filters.length && !isPhone ? <Button label="모두 지우기" variant="subtle" onClick={onClear} /> : null}
  </HStack>;
}
