import { cn } from 'cn';
import { ChevronDownIcon, ChevronRightIcon, FolderIcon } from '@/shared/ui/icon';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { pathTo, ROOT, type FolderNode } from '../../entities/node';
import type { FolderDnd } from './dnd';

/**
 * 폴더 나무(데스크톱). 폴더만 보이고 현재 폴더가 골라진 상태다. 키보드: ↑↓ 보이는 폴더 사이 이동, → 펼치기(이미 펼쳤으면
 * 첫 하위 폴더로), ← 접기(이미 접었으면 상위로), Home·End, Enter·Space 열기. 초점은 한 곳만 탭 순서에 둔다(roving).
 * 끌던 항목을 폴더 위에 놓으면 그 폴더로 옮긴다.
 */
export function FolderTree({ nodes, currentId, dnd, onOpen }: { nodes: FolderNode[]; currentId: string; dnd: FolderDnd; onOpen: (id: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(() => new Set([ROOT, ...pathTo(nodes, currentId).map(node => node.id)]));
  const [focusId, setFocusId] = useState(currentId);
  // 주소로 다른 폴더에 오면(경로 · 메뉴) 그 폴더까지 펼쳐 보이게 한다.
  useEffect(() => {
    setExpanded(open => new Set([...open, ...pathTo(nodes, currentId).map(node => node.id)]));
    setFocusId(currentId);
  }, [currentId, nodes]);
  const subfolders = (id: string) => nodes.filter(node => node.parentId === id && node.kind === 'folder').sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  const rows: { node: FolderNode; level: number }[] = [];
  const walk = (node: FolderNode | undefined, level: number) => {
    if (!node) return;
    rows.push({ node, level });
    if (expanded.has(node.id)) subfolders(node.id).forEach(child => walk(child, level + 1));
  };
  walk(nodes.find(node => node.id === ROOT), 1);
  const toggle = (id: string, isOpen: boolean) => setExpanded(open => {
    const next = new Set(open);
    if (isOpen) next.add(id); else next.delete(id);
    return next;
  });
  const focusRow = (id: string) => {
    setFocusId(id);
    requestAnimationFrame(() => box.current?.querySelector<HTMLElement>(`[data-node="${id}"]`)?.focus());
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = rows.findIndex(row => row.node.id === focusId);
    const row = rows[index];
    if (!row) return;
    const hasKids = subfolders(row.node.id).length > 0;
    const isOpen = expanded.has(row.node.id);
    const move = (target?: { node: FolderNode }) => { if (target) { event.preventDefault(); focusRow(target.node.id); } };
    if (event.key === 'ArrowDown') move(rows[index + 1]);
    else if (event.key === 'ArrowUp') move(rows[index - 1]);
    else if (event.key === 'Home') move(rows[0]);
    else if (event.key === 'End') move(rows[rows.length - 1]);
    else if (event.key === 'ArrowRight' && hasKids) {
      event.preventDefault();
      if (!isOpen) toggle(row.node.id, true); else move(rows[index + 1]);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (hasKids && isOpen) toggle(row.node.id, false);
      else move(rows.find(each => each.node.id === row.node.parentId));
    } else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(row.node.id); }
  };
  const tabbable = rows.some(row => row.node.id === focusId) ? focusId : rows[0]?.node.id;
  return (
    <div ref={box} role="tree" aria-label="폴더" className="flex flex-col gap-px" onKeyDown={onKeyDown}>
      {rows.map(({ node, level }) => {
        const hasKids = subfolders(node.id).length > 0;
        const isOpen = expanded.has(node.id);
        const isCurrent = node.id === currentId;
        return (
          <div key={node.id} role="treeitem" data-node={node.id} tabIndex={node.id === tabbable ? 0 : -1}
            aria-level={level} aria-selected={isCurrent} aria-expanded={hasKids ? isOpen : undefined}
            data-current={isCurrent || undefined} data-over={dnd.over === node.id || undefined}
            // check-ui: allow-style 단계마다 1rem씩 들여 쓴다(단계 수는 데이터다).
            style={{ paddingInlineStart: `calc(0.5rem + ${level - 1}rem)` }}
            onFocus={() => setFocusId(node.id)} onClick={() => onOpen(node.id)} {...dnd.dropProps(node.id)}
            className={cn('flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md pr-2 text-sm outline-none select-none hover:bg-row-hover',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset data-current:bg-pressed data-current:font-semibold',
              'data-over:bg-pressed data-over:ring-1 data-over:ring-primary data-over:ring-inset')}>
            <span aria-hidden className="grid size-4 shrink-0 place-items-center text-icon-muted"
              onClick={event => { if (hasKids) { event.stopPropagation(); toggle(node.id, !isOpen); } }}>
              {hasKids ? (isOpen ? <ChevronDownIcon className="size-3.5" /> : <ChevronRightIcon className="size-3.5" />) : null}
            </span>
            <FolderIcon chosen={isCurrent} className={cn('shrink-0', !isCurrent && 'text-icon-muted')} />
            <span className="min-w-0 truncate">{node.name}</span>
          </div>
        );
      })}
    </div>
  );
}
