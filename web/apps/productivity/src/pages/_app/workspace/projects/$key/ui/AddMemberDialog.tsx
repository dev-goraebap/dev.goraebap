import { useState } from 'react';
import { PROJECT_ROLE_LABEL, PROJECT_ROLES, type ProjectRole } from '@/entities/project';
import type { WorkItemPerson } from '@/entities/work-item';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { OptionList } from '@/shared/ui/kit/option-list';
import { PersonAvatar } from '@/shared/ui/person';
import { SegmentedControl } from '@/shared/ui/kit/segmented-control';

/**
 * 멤버 추가 (a short form): one working member not in the project yet, picked by name, and their role (an editor unless
 * another is chosen). A dialog on a desktop, a bottom sheet on a phone (FormDialog); it does not close while adding.
 */
export function AddMemberDialog({ people, isLoading, isPending, error, onAdd, onClose }: {
  people: readonly WorkItemPerson[]; isLoading: boolean; isPending: boolean; error: Error | null; onAdd: (userId: string, role: ProjectRole) => void; onClose: () => void;
}) {
  const [chosen, setChosen] = useState<string>();
  const [role, setRole] = useState<ProjectRole>('EDITOR');
  return (
    <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title="멤버 추가"
      submitLabel="추가" isSubmitDisabled={!chosen} isPending={isPending} onSubmit={() => { if (chosen) onAdd(chosen, role); }}>
      <SegmentedControl label="역할" value={role} onChange={setRole} className="w-full"
        options={PROJECT_ROLES.map(each => ({ value: each, label: PROJECT_ROLE_LABEL[each] }))} />
      {isLoading ? <p className="text-sm text-muted-foreground">구성원을 불러오는 중…</p>
        : people.length === 0 ? <p className="text-sm text-muted-foreground">더할 사람이 없습니다.</p>
          : (
            <div className="rounded-lg border p-1">
              <OptionList label="구성원" isSearchable chosen={chosen ? [chosen] : []} onPick={value => { if (!isPending) setChosen(value); }}
                options={people.map(person => ({
                  value: person.id, label: person.name,
                  icon: <PersonAvatar id={person.id} name={person.name} size={20} isStatic />,
                }))} />
            </div>
          )}
      {error ? <p role="alert" className="text-sm text-destructive">{error.message}</p> : null}
    </FormDialog>
  );
}
