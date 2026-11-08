import { ResizeHandle, useResizable } from '@astryxdesign/core/Resizable';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { useToast } from '@astryxdesign/core/Toast';
import { PageState } from '@kit/composites/state/PageState';
import { useIsPhone } from '@kit/foundations/media';
import { Page } from '@kit/layouts/page/Page';
import { PageBanner } from '@kit/layouts/page/PageParts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { folderHref, nodeKeys, nodeQueries, pathTo, ROOT, useFolderApi, type FolderNode } from '../../entities/node';
import { useFolderDnd } from './dnd';
import { MoveDialog, NameDialog } from './FolderDialogs';
import { FolderContents } from './FolderContents';
import { FolderTree } from './FolderTree';
import styles from './folders.module.css';

type Dialog = { kind: 'create' } | { kind: 'rename' | 'move'; node: FolderNode };

/**
 * 폴더 탐색. 머리 줄: 루트부터 현재 폴더까지의 경로(눌러서 위로 가기)·새 폴더. 데스크톱은 왼쪽에 폴더 나무, 오른쪽에 내용이고,
 * 휴대폰은 나무 없이 한 단계씩 들어가는 목록이다(←는 위 폴더). 현재 폴더는 주소가 가진다. 항목은 끌어서 폴더에 놓거나
 * 행 메뉴의 "옮기기"로 옮기며, 옮긴 뒤에는 토스트로 알리고 되돌릴 수 있다.
 * 상태 순서: 대기 → 실패(다시 시도) → 없는 폴더 → 빈 폴더(새 폴더 권유).
 */
export function FoldersPage() {
  const treeWidth = useResizable({defaultSize:224,minSizePx:160,maxSizePx:360});
  const api = useFolderApi();
  const client = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const isPhone = useIsPhone();
  const folderId = useLocation().pathname.split('/')[2] ?? ROOT;
  const query = useQuery(nodeQueries.all(api));
  const nodes = query.data ?? [];
  const folder = nodes.find(node => node.id === folderId && node.kind === 'folder');
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const refresh = () => client.invalidateQueries({ queryKey: nodeKeys.all });
  const open = (id: string) => void navigate({ href: folderHref(id) });
  const create = useMutation({ mutationFn: (name: string) => api.createFolder(folderId, name), onSuccess: async () => { await refresh(); setDialog(null); } });
  const rename = useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => api.rename(id, name), onSuccess: async () => { await refresh(); setDialog(null); } });
  const move = useMutation({
    mutationFn: ({ id, to }: { id: string; to: string }) => api.move(id, to),
    onSuccess: async (moved, { id, to }) => {
      const from = nodes.find(node => node.id === id)?.parentId;
      await refresh();
      setDialog(null);
      const destination = nodes.find(node => node.id === to)?.name ?? '';
      toast({
        body: `${moved.name}을(를) ${destination} 폴더로 옮겼습니다`, autoHideDuration: 8000,
        endContent: from ? <Button label="되돌리기" variant="ghost" size="sm" onClick={() => { void api.move(id, from).then(refresh); }} /> : undefined,
      });
    },
  });
  const dnd = useFolderDnd(nodes, (id, to) => { move.reset(); move.mutate({ id, to }); });
  const reset = () => { create.reset(); rename.reset(); move.reset(); };
  const path = pathTo(nodes, folderId);

  const body = () => {
    if (query.isPending) return <Center height="100%"><Spinner label="폴더를 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="폴더를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (!folder) return <PageState kind="not-found" title="폴더를 찾을 수 없습니다" description="지워졌거나 주소가 바뀌었을 수 있습니다."
      action={<Button label="내 폴더로" variant="secondary" href="/folders" />} />;
    const contents = <FolderContents nodes={nodes} folder={folder} isPhone={isPhone} dnd={dnd} onOpen={open} onCreate={() => { reset(); setDialog({ kind: 'create' }); }}
      onMove={node => { reset(); setDialog({ kind: 'move', node }); }} onRename={node => { reset(); setDialog({ kind: 'rename', node }); }} />;
    if (isPhone) return contents;
    return <div className={styles.split}>
      <aside className={styles.side} style={{width:treeWidth.size}}><FolderTree nodes={nodes} currentId={folder.id} dnd={dnd} onOpen={open} /></aside>
      <ResizeHandle label="폴더 목록 너비" resizable={treeWidth.props} hasDivider />
      <div className={styles.main}>{contents}</div>
    </div>;
  };

  return <>
    <Page crumbs={path.length ? path.map((node, index) => ({ label: node.name, icon: index === 0 ? 'folder' as const : undefined, href: index < path.length - 1 ? folderHref(node.id) : undefined }))
      : [{ label: '내 폴더', icon: 'folder' as const }]}
      create={folder ? { label: '새 폴더', onClick: () => { reset(); setDialog({ kind: 'create' }); } } : undefined}>
      {move.isError ? <PageBanner status="error" title="옮기지 못했습니다" description="잠시 후 다시 시도해 주세요." /> : null}
      {body()}
    </Page>
    {dialog?.kind === 'create' ? <NameDialog nodes={nodes} parentId={folderId} isPending={create.isPending}
      error={create.isError ? '만들지 못했습니다. 잠시 후 다시 시도해 주세요.' : undefined} onSubmit={name => create.mutate(name)} onClose={() => setDialog(null)} /> : null}
    {dialog?.kind === 'rename' ? <NameDialog nodes={nodes} parentId={dialog.node.parentId ?? ROOT} node={dialog.node} isPending={rename.isPending}
      error={rename.isError ? '이름을 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.' : undefined}
      onSubmit={name => rename.mutate({ id: dialog.node.id, name })} onClose={() => setDialog(null)} /> : null}
    {dialog?.kind === 'move' ? <MoveDialog nodes={nodes} node={dialog.node} isPending={move.isPending}
      error={move.isError ? '옮기지 못했습니다. 잠시 후 다시 시도해 주세요.' : undefined}
      onSubmit={to => move.mutate({ id: dialog.node.id, to })} onClose={() => setDialog(null)} /> : null}
  </>;
}
