import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type SyntheticEvent } from 'react';
import { useProjectCan } from '@/entities/project';
import { canDeleteWorkItem, DeleteWorkItemDialog, workItemOptions, type WorkItemRow } from '@/entities/work-item';
import { sessionOptions } from '@/shared/auth';
import { ActionMenu, type MenuAction } from '@/shared/ui/kit/action-menu';
import { LinkIcon, Trash2Icon } from '@/shared/ui/kit/icon';

// 행·카드 자체가 업무를 여는 링크라, 메뉴와 확인 창에서 일어난 클릭이 그 링크까지 올라가지 않게 막는다.
const hold = (event: SyntheticEvent) => { event.stopPropagation(); if ((event.target as Element).closest('a[href]') === null) return; event.preventDefault(); };

/**
 * 목록 행·표·보드 카드 끝의 …: 주소 복사와, 지울 수 있는 사람에게만 삭제. 목록 응답에는 작성자가 없어 메뉴에 손이 가면
 * 상세를 미리 읽어 권한을 판단한다(상세 화면과 같은 캐시). 줄 링크(::after) 위에 떠서 눌러도 상세로 가지 않는다.
 */
export function WorkItemRowMenu({ workItem, href }: { workItem: WorkItemRow; href?: string }) {
  const client = useQueryClient();
  const [isDeleting, setDeleting] = useState(false);
  const [isWanted, setWanted] = useState(false);
  const session = useQuery(sessionOptions()).data;
  const can = useProjectCan(isWanted ? workItem.projectKey : undefined);
  const view = useQuery({ ...workItemOptions(workItem.projectKey, workItem.number), enabled: isWanted });
  const prefetch = () => { if (!isWanted) { setWanted(true); void client.query(workItemOptions(workItem.projectKey, workItem.number)).catch(() => undefined); } };
  const actions: MenuAction[] = [
    ...(href ? [{ label: '주소 복사', icon: LinkIcon, onSelect: () => void navigator.clipboard.writeText(`${window.location.origin}${href}`) }] : []),
    ...(canDeleteWorkItem(view.data, session, can.manage) ? [{ label: '삭제', icon: Trash2Icon, onSelect: () => setDeleting(true) }] : []),
  ];
  return <span className="relative z-1 flex items-center" onClick={hold} onPointerEnter={prefetch} onFocus={prefetch} onPointerDown={event => event.stopPropagation()}>
    <ActionMenu label={`${workItem.ref} 메뉴`} title={workItem.ref} size="row" actions={actions} />
    {/* 확인 창은 고를 때만 만든다: 행마다 미리 만들면 목록을 떠날 때 수십 개를 한꺼번에 정리하느라 화면이 멈춘다. */}
    {isDeleting ? <DeleteWorkItemDialog workItem={view.data?.issue ?? workItem} isOpen onClose={() => setDeleting(false)} /> : null}
  </span>;
}
