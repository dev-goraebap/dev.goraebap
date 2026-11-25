import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { createDocumentLabel, type DocumentLabel } from '@/entities/document';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { cn } from 'cn';
import { Button } from '@goraebap/ui-react/compact/button';
import { ColorPalette, DEFAULT_MARK_COLOR } from '@/shared/ui/color-palette';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@goraebap/ui-react/components/command';
import { LabelDot } from '@/shared/ui/label-dot/LabelDot';
import { Spinner } from '@goraebap/ui-react/components/spinner';

/**
 * 문서 라벨 고르기: 이름으로 찾고 여러 개를 고른다. 찾는 이름의 라벨이 없고 라벨을 관리할 수 있으면(canCreate) 그 자리에서 색을 골라
 * 새 라벨을 만들고 바로 고른다.
 */
export function LabelChoices({ labels, value, onChange, canCreate = false }: {
  labels: DocumentLabel[]; value: string[]; onChange: (value: string[]) => void; canCreate?: boolean;
}) {
  const client = useQueryClient();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [color, setColor] = useState(DEFAULT_MARK_COLOR);
  const [extra, setExtra] = useState<DocumentLabel[]>([]);
  const available = [...new Map([...labels, ...extra].map(label => [label.id, label])).values()];
  const words = query.trim().toLowerCase();
  const shown = words ? available.filter(label => label.name.toLowerCase().includes(words)) : available;
  const create = useMutation({
    mutationFn: createDocumentLabel, onSuccess: (id, input) => {
      setExtra(old => [...old, { id, ...input, version: 0, position: 0, uses: 0 }]);
      onChange([...new Set([...value, id])]);
      setQuery('');
      void client.invalidateQueries({ queryKey: ['documents'] });
    },
  });
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter(each => each !== id) : [...value, id]);
  return <Command aria-label="라벨 검색" shouldFilter={false} className="max-h-88 p-0">
    <CommandInput placeholder="이름으로 찾기" value={query} onValueChange={setQuery} />
    <CommandList className="max-h-80 overscroll-contain">
      {shown.length ? <CommandGroup className="p-0 pt-1">
        {shown.map(label => <CommandItem key={label.id} value={label.id} data-checked={value.includes(label.id)} onSelect={() => toggle(label.id)}
          className={cn(isMobile ? 'min-h-12 gap-3 text-[0.9375rem]' : 'min-h-9')}>
          <LabelDot color={label.color} />
          <span className="min-w-0 flex-1 truncate">{label.name}</span>
        </CommandItem>)}
      </CommandGroup>
        : canCreate && words ? <div className="flex flex-col gap-3 p-2">
          <ColorPalette label="새 라벨 색상" value={color} onChange={setColor} />
          <Button disabled={query.trim().length > 200 || create.isPending} onClick={() => create.mutate({ name: query.trim(), color })}>
            {create.isPending ? <Spinner data-icon="inline-start" /> : null}
            {`“${query.trim()}” 라벨 만들기`}
          </Button>
          {create.error ? <p role="alert" className="text-sm text-destructive">{create.error.message}</p> : null}
        </div>
          : <p className="py-6 text-center text-sm text-muted-foreground">맞는 항목이 없습니다</p>}
    </CommandList>
  </Command>;
}
