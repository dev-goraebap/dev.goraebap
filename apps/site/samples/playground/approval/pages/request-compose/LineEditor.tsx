import { cn } from '@/shared/lib/utils';
import { AdaptivePopover } from '@/shared/ui/adaptive-popover';
import { Button } from '@/shared/ui/button';
import { PlusIcon, UserIcon, XIcon } from '@/shared/ui/icon';
import { OptionList } from '@/shared/ui/option-list';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { ReorderAnnouncer, ReorderGrip, reorderRowClass, useRowReorder } from '@/shared/ui/reorder';
import { useState } from 'react';
import { directory, me, type LinePerson } from '../../entities/approval';

/** 결재선의 한 줄: 번호 · 사진 · 이름 · 동작. 구분선만 쓰고 카드로 감싸지 않는다. */
export const LINE_ROW = 'flex min-h-12 items-center gap-3 border-b py-1.5';

function Name({ name, role }: { name: string; role: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate font-medium">{name}</span>
      <span className="truncate text-sm text-muted-foreground">{role}</span>
    </span>
  );
}

/**
 * 결재선 고르기: 맨 위에 신청자(빼거나 옮길 수 없다), 아래로 결재자를 차례대로. 순서는 끌기 손잡이(또는 Alt + ↑/↓)로 바꾸고 빼기로 지운다.
 * 결재자는 이름으로 찾아 더한다(이미 있는 사람과 신청자는 고르는 목록에서 뺀다). 한 명도 없으면 error를 추가 버튼 곁에 알린다.
 */
export function LineEditor({ line, onChange, error }: { line: LinePerson[]; onChange: (line: LinePerson[]) => void; error?: string }) {
  const [isAdding, setAdding] = useState(false);
  const reorder = useRowReorder<HTMLUListElement>({
    rows: line.map(person => ({ id: person.approver, name: person.approver })),
    noun: { word: '결재자', object: '결재자를', topic: '결재자는' },
    onReorder: async ids => { onChange(ids.map(id => line.find(person => person.approver === id)!)); },
  });
  const shown = reorder.order.map(id => line.find(person => person.approver === id)).filter((person): person is LinePerson => !!person);
  const candidates = directory.filter(each => each.approver !== me && !line.some(person => person.approver === each.approver));
  return (
    <div className="flex flex-col gap-3">
      <ul ref={reorder.list} aria-label="결재선" className="flex flex-col border-t">
        <li className={LINE_ROW}>
          <span aria-hidden className="grid w-5 shrink-0 place-items-center text-icon-muted"><UserIcon className="size-4" /></span>
          <PersonAvatar name={me} className="size-8" />
          <Name name={me} role="신청자" />
        </li>
        {shown.map((person, index) => (
          <li key={person.approver} className={cn(LINE_ROW, reorderRowClass, 'bg-background')} {...reorder.rowProps(person.approver)}>
            <ReorderGrip {...reorder.gripProps({ id: person.approver, name: person.approver })} className="-ml-1" />
            <span aria-hidden className="-ml-2 w-4 shrink-0 text-center text-sm text-muted-foreground tabular-nums">{index + 1}</span>
            <PersonAvatar name={person.approver} className="size-8" />
            <Name name={person.approver} role={person.role} />
            <Button variant="ghost" size="icon-sm" aria-label={`${person.approver} 빼기`} title="빼기" className="max-md:size-11"
              onClick={() => onChange(line.filter(each => each.approver !== person.approver))}>
              <XIcon />
            </Button>
          </li>
        ))}
      </ul>
      <ReorderAnnouncer reorder={reorder} />
      <div className="flex flex-wrap items-center gap-3" data-invalid-field={error ? '' : undefined}>
        <AdaptivePopover title="결재자 추가" open={isAdding} onOpenChange={setAdding} className="w-72 p-1.5"
          trigger={<Button variant="secondary" size="sm" className="max-md:h-11 max-md:px-4"><PlusIcon data-icon="inline-start" />결재자 추가</Button>}>
          {candidates.length
            ? <OptionList label="결재자 고르기" isSearchable
              options={candidates.map(each => ({ value: each.approver, label: `${each.approver} · ${each.role}`, icon: <PersonAvatar name={each.approver} className="size-5" /> }))}
              onPick={name => { const picked = candidates.find(each => each.approver === name); if (picked) onChange([...line, picked]); setAdding(false); }} />
            : <p className="p-2 text-sm text-muted-foreground">더할 수 있는 사람이 없습니다.</p>}
        </AdaptivePopover>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
