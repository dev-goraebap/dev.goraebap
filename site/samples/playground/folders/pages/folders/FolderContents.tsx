import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { ListItem } from '@astryxdesign/core/List';
import { pixel, proportional, type TablePlugin } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { RowMenu } from '@/shared/ui/composites/popup/RowMenu';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { PageList, PageTable } from '@/shared/ui/layouts/page/PageParts';
import { useMemo } from 'react';
import { childrenOf, folderHref, sizeText, type FolderNode } from '../../entities/node';
import type { FolderDnd } from './dnd';
import styles from './folders.module.css';

const mark = (node: FolderNode) => icon(node.kind === 'folder' ? 'folder' : node.type === 'image' ? 'image' : 'document');
const dateText = (value: string) => `${Number(value.slice(5, 7))}월 ${Number(value.slice(8, 10))}일`;

type Handlers = { onOpen: (id: string) => void; onMove: (node: FolderNode) => void; onRename: (node: FolderNode) => void };

const rowMenu = (node: FolderNode, { onMove, onRename }: Handlers) => <RowMenu label={`${node.name} 메뉴`} actions={[
  { id: 'move', label: '옮기기', icon: 'move', onSelect: () => onMove(node) },
  { id: 'rename', label: '이름 바꾸기', icon: 'edit', onSelect: () => onRename(node) },
]} />;

/**
 * 표 행의 동작: 폴더 행을 누르면 열고, 행은 끌 수 있으며, 폴더 행에는 끌어 온 항목을 놓을 수 있다. 행 안의 링크·버튼을 누른
 * 것은 열지 않는다. 키보드는 이름 칸의 링크로 열고 "옮기기" 메뉴로 옮긴다.
 */
function useFolderRows(dnd: FolderDnd, onOpen: (id: string) => void): Record<string, TablePlugin<FolderNode>> {
  return useMemo(() => ({
    rows: {
      transformBodyRow: (props, node) => ({
        ...props,
        htmlProps: {
          ...props.htmlProps,
          ...dnd.dragProps(node.id),
          ...(node.kind === 'folder' ? dnd.dropProps(node.id) : {}),
          'data-over': dnd.over === node.id || undefined,
          className: [props.htmlProps.className, node.kind === 'folder' ? styles.openRow : undefined].filter(Boolean).join(' '),
          onClick: event => {
            if (event.defaultPrevented || (event.target instanceof Element && event.target.closest('a[href], button, input, [role="button"]'))) return;
            if (node.kind === 'folder') onOpen(node.id);
          },
        },
      }),
    },
  }), [dnd, onOpen]);
}

/**
 * 한 폴더의 내용. 데스크톱은 표(이름·수정일·크기, 행 끝 메뉴), 휴대폰은 행 목록이다. 폴더가 먼저, 같은 종류는 이름 순.
 * 비어 있으면 상태 화면에서 새 폴더를 권한다.
 */
export function FolderContents({ nodes, folder, isPhone, dnd, onCreate, ...handlers }: Handlers & {
  nodes: FolderNode[]; folder: FolderNode; isPhone: boolean; dnd: FolderDnd; onCreate: () => void;
}) {
  const items = childrenOf(nodes, folder.id);
  const plugins = useFolderRows(dnd, handlers.onOpen);
  if (items.length === 0) return <PageState kind="empty" title="이 폴더는 비어 있습니다" description="다른 폴더에서 항목을 옮겨 오거나 새 폴더를 만들어 보세요."
    action={<Button label="새 폴더" variant="secondary" icon={icon('plus')} onClick={onCreate} />} />;
  const detail = (node: FolderNode) => node.kind === 'folder' ? `${childrenOf(nodes, node.id).length}개 항목` : sizeText(node.size);
  if (isPhone) return <PageList hasDividers aria-label={`${folder.name} 내용`}>
    {items.map(node => <ListItem key={node.id} label={<Text weight="medium" maxLines={1}>{node.name}</Text>}
      description={<Text type="supporting" color="secondary" hasTabularNumbers>{detail(node)} · {dateText(node.updatedAt)}</Text>}
      startContent={<span className={styles.mark}>{mark(node)}</span>} href={node.kind === 'folder' ? folderHref(node.id) : undefined}
      endContent={rowMenu(node, handlers)} />)}
  </PageList>;
  return <PageTable<FolderNode> data={items} hasHover textOverflow="truncate" plugins={plugins} aria-label={`${folder.name} 내용`} columns={[
    { key: 'name', header: '이름', width: proportional(1), renderCell: node => <HStack gap={2} vAlign="center">
      <span className={styles.mark}>{mark(node)}</span>
      {node.kind === 'folder' ? <Link href={folderHref(node.id)}>{node.name}</Link> : <Text maxLines={1}>{node.name}</Text>}
    </HStack> },
    { key: 'updatedAt', header: '수정일', width: pixel(110), renderCell: node => <Text color="secondary" hasTabularNumbers>{dateText(node.updatedAt)}</Text> },
    { key: 'size', header: '크기', width: pixel(110), align: 'end', renderCell: node => <Text color="secondary" hasTabularNumbers>{detail(node)}</Text> },
    { key: 'menu', header: <VisuallyHidden>메뉴</VisuallyHidden>, width: pixel(56), align: 'end', renderCell: node => rowMenu(node, handlers) },
  ]} />;
}
