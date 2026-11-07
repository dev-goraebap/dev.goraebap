import { OptionList } from './OptionList';
import { picked, type ListFilter } from './types';

/** 한 속성의 값 고르기: 여럿이면 열어 둔 채 더 고르고, 하나면 고른 뒤 닫는다(onDone). 같은 값을 다시 고르면 해제한다. */
export function FilterValues({ filter, chosen = [], onChange, onDone, size }: {
  filter: ListFilter; chosen?: string[]; onChange: (values: string[]) => void; onDone?: () => void; size?: 'sm' | 'lg';
}) {
  return <OptionList label={`${filter.label} 고르기`} options={filter.options} chosen={chosen} isMultiple={filter.isMultiple}
    isSearchable={filter.isSearchable ?? filter.options.length > 7} size={size}
    onPick={value => { onChange(picked(filter, chosen, value)); if (!filter.isMultiple) onDone?.(); }} />;
}
