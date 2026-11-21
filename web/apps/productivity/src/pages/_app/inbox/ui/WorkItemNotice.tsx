import { useNavigate } from '@tanstack/react-router';
import type { NoticeTarget } from '@/entities/notification';
import { workItemHref } from '@/entities/work-item';
import { WorkItemDetail } from '@/features/work-item-detail';
import type { NoticeFrame } from './NoticeDetail';

export function WorkItemNotice({ target, frame }: { target: NoticeTarget; frame: NoticeFrame }) {
  const navigate = useNavigate();
  return <>{frame({
    title: `${target.projectKey}-${target.number}`, column: false, label: `${target.projectKey}-${target.number}`, href: workItemHref(target),
    content: <WorkItemDetail projectKey={target.projectKey} number={target.number} hrefOf={workItemHref}
      onDeleted={() => void navigate({ href: '/inbox', replace: true })} />,
  })}</>;
}
