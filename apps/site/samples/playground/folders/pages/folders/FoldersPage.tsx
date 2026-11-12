import { useIsMobile } from '@/shared/lib/use-mobile';
import { useStoredWidth } from '@/shared/lib/use-stored-width';
import { Alert, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FolderIcon, TriangleAlertIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PaneResizeHandle } from '@/shared/ui/pane-resize-handle';
import { Spinner } from '@/shared/ui/spinner';
import { toast } from '@/shared/ui/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useState, type CSSProperties } from 'react';
import { folderHref, nodeKeys, nodeQueries, pathTo, ROOT, useFolderApi, type FolderNode } from '../../entities/node';
import { useFolderDnd } from './dnd';
import { FolderContents } from './FolderContents';
import { MoveDialog, NameDialog } from './FolderDialogs';
import { FolderTree } from './FolderTree';

type Dialog = { kind: 'create' } | { kind: 'rename' | 'move'; node: FolderNode };

/** 라우터 주소의 타입은 사이트 라우터에 등록되어 있어, 견본 앱의 주소는 글자로 넘긴다. */
const HOME: string = '/folders';

/**
 * 폴더 탐색. 머리 줄: 루트부터 현재 폴더까지의 경로(눌러서 위로 가기) · 새 폴더. 데스크톱은 왼쪽에 폴더 나무(끌어서 너비를 바꾼다),
 * 오른쪽에 내용이고, 휴대폰은 나무 없이 한 단계씩 들어가는 목록이다(앱 바 ←는 위 폴더). 현재 폴더는 주소가 가진다. 항목은 끌어서 폴더에
 * 놓거나 행 메뉴의 "옮기기"로 옮기며, 옮긴 뒤에는 토스트로 알리고 되돌릴 수 있다.
 * 상태 순서: 대기 → 실패(다시 시도) → 없는 폴더 → 빈 폴더(새 폴더 권유).
 */
export function FoldersPage() {
  const [treeWidth, setTreeWidth] = useStoredWidth({ key: 'playground-folders:tree', min: 160, max: 360, initial: 224 });
  const api = useFolderApi();
  const client = useQueryClient();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
      toast.add({
        title: `${moved.name}을(를) ${destination} 폴더로 옮겼습니다`, timeout: 8000,
        actionProps: from ? { children: '되돌리기', onClick: () => { void api.move(id, from).then(refresh); } } : undefined,
      });
    },
  });
  const dnd = useFolderDnd(nodes, (id, to) => { move.reset(); move.mutate({ id, to }); });
  const reset = () => { create.reset(); rename.reset(); move.reset(); };
  const startCreate = () => { reset(); setDialog({ kind: 'create' }); };
  const path = pathTo(nodes, folderId);

  const body = () => {
    if (query.isPending) return <div className="flex flex-1 items-center justify-center"><Spinner aria-label="폴더를 불러오는 중" className="size-6" /></div>;
    if (query.isError && !query.data) return <PageState kind="error" title="폴더를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    if (!folder) return <PageState kind="not-found" title="폴더를 찾을 수 없습니다" description="지워졌거나 주소가 바뀌었을 수 있습니다."
      action={<Button variant="secondary" nativeButton={false} render={<Link to={HOME} />}>내 폴더로</Button>} />;
    const contents = <FolderContents nodes={nodes} folder={folder} isMobile={isMobile} dnd={dnd} onCreate={startCreate}
      onMove={node => { reset(); setDialog({ kind: 'move', node }); }} onRename={node => { reset(); setDialog({ kind: 'rename', node }); }} />;
    if (isMobile) return contents;
    return (
      <div className="flex min-h-full flex-1 bg-background">
        {/* check-ui: allow-style 나무 너비는 사용자가 끌어 정한 값이다. */}
        <aside aria-label="폴더 나무" style={{ width: `${treeWidth / 16}rem` } as CSSProperties}
          className="sticky top-0 box-border max-h-full shrink-0 self-start overflow-auto p-2">
          <FolderTree nodes={nodes} currentId={folder.id} dnd={dnd} onOpen={open} />
        </aside>
        <PaneResizeHandle label="폴더 목록 너비" value={treeWidth} min={160} max={360} onChange={setTreeWidth} />
        <div className="min-w-0 flex-1">{contents}</div>
      </div>
    );
  };

  return (
    <>
      <Page crumbs={path.length ? path.map((node, index) => ({ label: node.name, icon: index === 0 ? FolderIcon : undefined, href: index < path.length - 1 ? folderHref(node.id) : undefined }))
        : [{ label: '내 폴더', icon: FolderIcon }]}
        create={folder ? { label: '새 폴더', onClick: startCreate } : undefined}
        below={move.isError ? (
          <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0"><TriangleAlertIcon /><AlertTitle>옮기지 못했습니다. 잠시 후 다시 시도해 주세요.</AlertTitle></Alert>
        ) : undefined}>
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
    </>
  );
}
