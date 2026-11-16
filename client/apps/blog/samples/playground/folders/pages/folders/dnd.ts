import { useRef, useState, type DragEvent } from 'react';
import { canMove, type FolderNode } from '../../entities/node';

/**
 * 끌어서 옮기기. 끄는 항목은 ref에 둔다(끄는 동안 dataTransfer의 값은 읽을 수 없다). 놓을 수 있는 폴더(canMove)에서만 놓기를
 * 받고, 그 폴더를 over로 알려 강조하게 한다. 끌기는 같은 일을 하는 "옮기기" 메뉴의 손쉬운 길이며, 끌기만으로 하지 않는다.
 */
export function useFolderDnd(nodes: FolderNode[], onMove: (id: string, parentId: string) => void) {
  const dragging = useRef<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const dragProps = (id: string) => ({
    draggable: true,
    onDragStart: (event: DragEvent) => {
      dragging.current = id;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', id);
    },
    onDragEnd: () => { dragging.current = null; setOver(null); },
  });
  const dropProps = (folderId: string) => ({
    onDragOver: (event: DragEvent) => {
      if (!dragging.current || !canMove(nodes, dragging.current, folderId)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setOver(folderId);
    },
    onDragLeave: () => setOver(current => (current === folderId ? null : current)),
    onDrop: (event: DragEvent) => {
      const id = dragging.current;
      dragging.current = null;
      setOver(null);
      if (!id || !canMove(nodes, id, folderId)) return;
      event.preventDefault();
      onMove(id, folderId);
    },
  });
  return { dragProps, dropProps, over };
}

export type FolderDnd = ReturnType<typeof useFolderDnd>;
