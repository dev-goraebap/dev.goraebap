import { focusFirstInvalid } from '@/shared/lib/focus-invalid';
import { FormDialog } from '@/shared/ui/form-dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useId, useState } from 'react';
import { canMove, hasName, pathTo, type FolderNode } from '../../entities/node';

/** 칸 곁의 오류와 저장 실패. */
const Problem = ({ id, children }: { id?: string; children: string }) => <p id={id} role="alert" className="text-sm text-destructive">{children}</p>;

/**
 * 새 폴더 · 이름 바꾸기: 칸 하나짜리 짧은 양식(데스크톱 대화상자, 휴대폰 바텀시트). 같은 폴더 안의 같은 이름은 칸 곁에 알린다.
 * 저장 실패는 양식 안에 알리고 입력을 지킨다.
 */
export function NameDialog({ nodes, parentId, node, isPending, error, onSubmit, onClose }: {
  nodes: FolderNode[]; parentId: string; node?: FolderNode; isPending: boolean; error?: string; onSubmit: (name: string) => void; onClose: () => void;
}) {
  const id = useId();
  const [name, setName] = useState(node?.name ?? '');
  const [isTried, setTried] = useState(false);
  const problem = !name.trim() ? '이름을 입력해 주세요.' : hasName(nodes, parentId, name, node?.id) ? '같은 이름이 이미 있습니다.' : undefined;
  const label = node?.kind === 'file' ? '파일 이름' : '폴더 이름';
  const submit = () => {
    setTried(true);
    if (problem) { focusFirstInvalid(); return; }
    onSubmit(name.trim());
  };
  return (
    <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={node ? `“${node.name}” 이름 바꾸기` : '새 폴더'} submitLabel={node ? '바꾸기' : '만들기'}
      isPending={isPending} onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Input id={id} value={name} autoFocus autoComplete="off" onChange={event => setName(event.target.value)} aria-invalid={isTried && !!problem || undefined}
          aria-describedby={isTried && problem ? `${id}-problem` : undefined} className="max-md:h-11 max-md:text-base" />
        {isTried && problem ? <Problem id={`${id}-problem`}>{problem}</Problem> : null}
        {error ? <Problem>{error}</Problem> : null}
      </div>
    </FormDialog>
  );
}

/**
 * 옮기기: 끌어서 옮기는 것과 같은 일을 하는 길(키보드 · 휴대폰 · 끌기가 불편한 사람). 옮길 수 있는 폴더만 경로와 함께 나열한다.
 */
export function MoveDialog({ nodes, node, isPending, error, onSubmit, onClose }: {
  nodes: FolderNode[]; node: FolderNode; isPending: boolean; error?: string; onSubmit: (parentId: string) => void; onClose: () => void;
}) {
  const id = useId();
  const [target, setTarget] = useState('');
  const [isTried, setTried] = useState(false);
  const options = nodes.filter(each => each.kind === 'folder' && canMove(nodes, node.id, each.id))
    .map(each => ({ value: each.id, label: pathTo(nodes, each.id).map(step => step.name).join(' / ') }));
  const submit = () => {
    setTried(true);
    if (!target) { focusFirstInvalid(); return; }
    onSubmit(target);
  };
  const isMissing = isTried && !target;
  return (
    <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={`“${node.name}” 옮기기`} submitLabel="옮기기" isPending={isPending} onSubmit={submit}>
      <div className="flex flex-col gap-2">
        <Label id={`${id}-label`}>옮길 폴더</Label>
        <Select items={options} value={target || null} onValueChange={value => setTarget(String(value ?? ''))}>
          <SelectTrigger aria-labelledby={`${id}-label`} aria-invalid={isMissing || undefined} className="w-full max-md:h-11">
            <SelectValue placeholder="폴더를 고르세요" />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {isMissing ? <Problem>{options.length ? '옮길 폴더를 골라 주세요.' : '옮길 수 있는 폴더가 없습니다.'}</Problem> : null}
        {error ? <Problem>{error}</Problem> : null}
      </div>
    </FormDialog>
  );
}
