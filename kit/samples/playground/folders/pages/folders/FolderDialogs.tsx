import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { FormDialog } from '@kit/composites/dialog/FormDialog';
import { focusFirstInvalid } from '@kit/patterns/compose/validation';
import { useState } from 'react';
import { canMove, hasName, pathTo, type FolderNode } from '../../entities/node';

/**
 * 새 폴더·이름 바꾸기: 칸 하나짜리 짧은 양식. 같은 폴더 안의 같은 이름은 칸 곁에 알린다. 저장 실패는 양식 안에 알리고 입력을 지킨다.
 */
export function NameDialog({ nodes, parentId, node, isPending, error, onSubmit, onClose }: {
  nodes: FolderNode[]; parentId: string; node?: FolderNode; isPending: boolean; error?: string; onSubmit: (name: string) => void; onClose: () => void;
}) {
  const [name, setName] = useState(node?.name ?? '');
  const [isTried, setTried] = useState(false);
  const problem = !name.trim() ? '이름을 입력해 주세요.' : hasName(nodes, parentId, name, node?.id) ? '같은 이름이 이미 있습니다.' : undefined;
  const submit = () => {
    setTried(true);
    if (problem) { focusFirstInvalid(); return; }
    onSubmit(name.trim());
  };
  return <FormDialog title={node ? `“${node.name}” 이름 바꾸기` : '새 폴더'} submitLabel={node ? '바꾸기' : '만들기'} isPending={isPending} error={error}
    onSubmit={submit} onClose={onClose}>
    <TextInput label={node?.kind === 'file' ? '파일 이름' : '폴더 이름'} value={name} onChange={setName} hasAutoFocus
      statusVariant="detached" status={isTried && problem ? { type: 'error', message: problem } : undefined} />
  </FormDialog>;
}

/**
 * 옮기기: 끌어서 옮기는 것과 같은 일을 하는 길(키보드·휴대폰·끌기가 불편한 사람). 옮길 수 있는 폴더만 경로와 함께 나열한다.
 */
export function MoveDialog({ nodes, node, isPending, error, onSubmit, onClose }: {
  nodes: FolderNode[]; node: FolderNode; isPending: boolean; error?: string; onSubmit: (parentId: string) => void; onClose: () => void;
}) {
  const [target, setTarget] = useState('');
  const [isTried, setTried] = useState(false);
  const options = nodes.filter(each => each.kind === 'folder' && canMove(nodes, node.id, each.id))
    .map(each => ({ value: each.id, label: pathTo(nodes, each.id).map(step => step.name).join(' / ') }));
  const submit = () => {
    setTried(true);
    if (!target) { focusFirstInvalid(); return; }
    onSubmit(target);
  };
  return <FormDialog title={`“${node.name}” 옮기기`} submitLabel="옮기기" isPending={isPending} error={error} onSubmit={submit} onClose={onClose}>
    <Selector label="옮길 폴더" placeholder="폴더를 고르세요" value={target} options={options} onChange={value => setTarget(String(value))}
      status={isTried && !target ? { type: 'error', message: options.length ? '옮길 폴더를 골라 주세요.' : '옮길 수 있는 폴더가 없습니다.' } : undefined} />
  </FormDialog>;
}
