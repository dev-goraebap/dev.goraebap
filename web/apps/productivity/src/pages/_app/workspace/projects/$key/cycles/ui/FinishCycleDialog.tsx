import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { completeCycle, cycleDays, refreshWorkItems, type Cycle } from '@/entities/work-item';
import { FormDialog } from '@/shared/ui/kit/form-dialog';

const NONE = 'none';

/** One choice: a real radio, hidden, so arrow keys and Space work as the browser has them. */
function Choice({ name, value, chosen, label, description, onChoose }: {
  name: string; value: string; chosen: string; label: string; description?: string; onChoose: (value: string) => void;
}) {
  return <label className="flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-sm has-checked:border-primary has-checked:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/50 max-md:min-h-12">
    <input type="radio" name={name} value={value} checked={chosen === value} onChange={() => onChoose(value)} className="sr-only" />
    <span className="font-medium">{label}</span>
    {description ? <span className="text-muted-foreground">{description}</span> : null}
  </label>;
}

/** 사이클 마치기: 끝내지 못한 업무가 있으면 옮길 사이클(마치지 않은 다른 사이클)이나 '사이클 없음'을 고른다. */
export function FinishCycleDialog({ projectKey, cycle, cycles, onClose }: { projectKey: string; cycle: Cycle; cycles: Cycle[]; onClose: () => void }) {
  const client = useQueryClient();
  const name = useId();
  const targets = cycles.filter(other => other.id !== cycle.id && other.state !== 'COMPLETED');
  const [target, setTarget] = useState(targets[0]?.id ?? NONE);
  const left = (cycle.totals?.workItems ?? 0) - (cycle.totals?.completed ?? 0) - (cycle.totals?.canceled ?? 0);
  const finish = useMutation({
    mutationFn: () => completeCycle(projectKey, cycle, target === NONE ? undefined : target),
    onSuccess: async () => { await refreshWorkItems(client); onClose(); },
  });
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={`'${cycle.name}' 마치기`} submitLabel="마치기"
    description={left > 0 ? `끝내지 못한 업무 ${left}건을 어디로 옮길까요?` : '끝내지 못한 업무가 없습니다.'}
    isPending={finish.isPending} onSubmit={() => finish.mutate()}>
    {left > 0 ? <div role="radiogroup" aria-label="옮길 사이클" className="flex flex-col gap-2">
      {targets.map(other => <Choice key={other.id} name={name} value={other.id!} chosen={target} label={other.name!} description={cycleDays(other)} onChoose={setTarget} />)}
      <Choice name={name} value={NONE} chosen={target} label="사이클 없음" onChoose={setTarget} />
    </div> : null}
    {finish.error ? <p role="alert" className="text-sm text-destructive">{finish.error.message}</p> : null}
  </FormDialog>;
}
