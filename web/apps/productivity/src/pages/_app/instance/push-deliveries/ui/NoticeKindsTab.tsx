import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { kindOf } from '@/entities/notification';
import { Badge } from '@goraebap/ui-react/compact/badge';
import { Button } from '@goraebap/ui-react/compact/button';
import { PageState } from '@/shared/ui/kit/page-state';
import { Facts } from '@/shared/ui/kit/side-panel';
import { noticeKindsOptions, type NoticeKindRow } from '../api/push';
import { NOTICE_KINDS } from '../model/notice-kinds';
import { formatPushMoment, PUSH_SURFACE } from '../model/push-format';
import { NoticeKindExample } from './NoticeKindExample';
import { PushToneBadge } from './PushToneBadge';

const kindCounts = (row?: NoticeKindRow) =>
  `알림 ${row?.notices ?? 0}건 · 받은 사람 ${row?.recipients ?? 0}명 · 푸시 전달 ${row?.pushed ?? 0}건${row?.lastAt ? ` · 마지막 ${formatPushMoment(row.lastAt)}` : ''}`;

/**
 * 알림 종류, read only: each kind of notice, when it goes, to whom, whose picture it shows, where it opens and under which
 * push group a member may turn it off, with its latest notice as an example and the last thirty days in numbers. A
 * kind the server has sent that is not described yet still shows, by its code, so nothing sent is hidden.
 */
export function NoticeKindsTab() {
  const kinds = useQuery(noticeKindsOptions());
  if (kinds.isPending) return null;
  if (kinds.isError) return <PageState kind="error" title="알림 종류를 불러오지 못했습니다" description={kinds.error.message}
    action={<Button variant="secondary" onClick={() => void kinds.refetch()}>다시 시도</Button>} />;
  const sent = new Map(kinds.data.map(row => [row.kind, row]));
  const unknown = kinds.data.filter(row => !NOTICE_KINDS.some(kind => kind.kind === row.kind));
  return <div className="flex flex-col gap-4 p-4">
    <p className="text-sm text-muted-foreground">최근 30일</p>
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {NOTICE_KINDS.map(kind => {
        const row = sent.get(kind.kind);
        const label = kindOf(kind.kind);
        return <li key={kind.kind} className={cn(PUSH_SURFACE, 'flex flex-col gap-3')}>
          <div className="flex items-center gap-2"><PushToneBadge label={label.label} tone={label.color} /><span className="font-mono text-xs text-muted-foreground">{kind.kind}</span></div>
          <NoticeKindExample row={row} />
          <Facts facts={[['보내는 때', kind.when], ['받는 사람', kind.to], ['보낸 사람으로 보임', kind.from], ['누르면', kind.opens], ['푸시 끄기', `설정의 '${kind.pushGroup}'`]]} />
          <p className="text-sm text-muted-foreground tabular-nums">{kindCounts(row)}</p>
        </li>;
      })}
      {unknown.map(row => <li key={row.kind} className={cn(PUSH_SURFACE, 'flex flex-col gap-3')}>
        <div className="flex items-center gap-2"><Badge variant="outline">설명 없음</Badge><span className="font-mono text-xs text-muted-foreground">{row.kind}</span></div>
        <NoticeKindExample row={row} />
        <p className="text-sm text-muted-foreground tabular-nums">{kindCounts(row)}</p>
      </li>)}
    </ul>
  </div>;
}
