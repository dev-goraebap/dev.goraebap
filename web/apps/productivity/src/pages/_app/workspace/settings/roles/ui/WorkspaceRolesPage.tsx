import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { sessionOptions } from '@/shared/auth';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { Button } from '@goraebap/ui-react/compact/button';
import { CheckIcon } from '@/shared/ui/kit/icon';
import { SettingsPage, SettingsSection } from '@/shared/ui/kit/settings';

type Crumb = { label: string; href?: string; icon?: string };

/** The roles, the least first; a role may do all the roles before it may (an editor's 지우기 is their own issues'). */
type Role = 'viewer' | 'editor' | 'admin' | 'projects';

/** What each role may do, from the least role that may (cowork-projects 권한, 2026-11-15). */
const ABILITIES: readonly { label: string; from: Role; note?: string }[] = [
  { label: '프로젝트 · 업무 · 문서 · 사이클 · 프로젝트 일정 보기', from: 'viewer' },
  { label: '댓글 쓰기', from: 'viewer' },
  { label: '업무 만들고 고치기 · 본문 · 시간 기록 · 사이클에 넣기', from: 'editor' },
  { label: '문서 만들고 고치기 (문서 권한이 허락하는 곳)', from: 'editor' },
  { label: '업무 지우기', from: 'editor', note: '에디터는 자기가 만든 업무만' },
  { label: '프로젝트 설정 (이름 · 상태 · 저장소 연동 · 사이클 · 공유 뷰)', from: 'admin' },
  { label: '이 프로젝트의 멤버 넣고 빼기 · 역할 바꾸기', from: 'admin' },
  { label: '프로젝트 만들기 · 보관 · 삭제 · 되살리기 · 순서', from: 'projects' },
  { label: '라벨 · 업무 유형 · 문서 라벨 관리', from: 'projects' },
];

const ORDER: readonly Role[] = ['viewer', 'editor', 'admin', 'projects'];

const ROLES: readonly { role: Role; name: string; short: string; summary: string }[] = [
  { role: 'viewer', name: '뷰어', short: '뷰어', summary: '프로젝트 멤버입니다. 프로젝트와 그 업무 · 문서를 보고 댓글을 씁니다.' },
  { role: 'editor', name: '에디터', short: '에디터', summary: '뷰어가 하는 일에 더해 업무와 문서를 만들고 고칩니다.' },
  { role: 'admin', name: '관리자', short: '관리자', summary: '에디터가 하는 일에 더해 그 프로젝트의 설정과 멤버 · 역할을 맡습니다. 프로젝트마다 한 명 이상 있습니다.' },
  { role: 'projects', name: '워크스페이스 관리자', short: '워크스페이스', summary: '모든 프로젝트의 관리자입니다. 프로젝트를 만들고 보관 · 삭제하며 라벨 · 업무 유형 · 문서 라벨을 맡습니다.' },
];

/** The abilities side by side, a column per role; narrower on a phone. */
const ABILITY_ROW = 'grid min-h-10 grid-cols-[minmax(0,1fr)_repeat(3,4.5rem)_6rem] items-center gap-x-2 px-4 max-md:grid-cols-[minmax(0,1fr)_repeat(4,2.75rem)] max-md:gap-x-1';

/**
 * 업무 관리 › 역할 (cowork-projects 권한, 2026-11-15): a project's members are its viewers, editors or administrators,
 * and only they see it; a 워크스페이스 관리자 is every project's administrator. The page shows each role as a plain line,
 * then what each may do side by side. A member's role is given on the project's 멤버 page or the area's 멤버 page; who is
 * a 워크스페이스 관리자 is given in 인스턴스 관리 › 권한 (an instance administrator's page), linked here.
 */
export function WorkspaceRolesPage({ crumbs }: { crumbs: Crumb[] }) {
  const session = useQuery(sessionOptions()).data;
  const canGive = (session?.roles ?? []).includes('INSTANCE_ADMIN');
  return <SettingsPage crumbs={pageCrumbs(crumbs)} title="역할">
    <SettingsSection title="역할"
      action={canGive ? <Button variant="secondary" size="sm" nativeButton={false} render={<Link to="/instance/members" />}>워크스페이스 관리자 지정</Button> : undefined}>
      {ROLES.map(each => <div key={each.role} className="flex flex-col gap-0.5 px-4 py-3">
        <p className="font-semibold">{each.name}</p>
        <p className="text-sm text-muted-foreground">{each.summary}</p>
      </div>)}
    </SettingsSection>
    <SettingsSection title="할 수 있는 일">
      <div role="table" aria-label="할 수 있는 일" className="flex flex-col divide-y divide-border">
        <div className={`${ABILITY_ROW} min-h-8`} role="row">
          <span role="columnheader" className="text-xs font-medium text-muted-foreground">일</span>
          {ROLES.map(each => <span key={each.role} role="columnheader" className="truncate text-center text-xs font-medium text-muted-foreground">{each.short}</span>)}
        </div>
        {ABILITIES.map(ability => <div key={ability.label} className={ABILITY_ROW} role="row">
          <span role="cell" className="flex flex-col py-2">
            <span>{ability.label}</span>
            {ability.note ? <span className="text-xs text-muted-foreground">{ability.note}</span> : null}
          </span>
          {ROLES.map(each => {
            const can = ORDER.indexOf(each.role) >= ORDER.indexOf(ability.from);
            return <span key={each.role} role="cell" className="flex justify-center" aria-label={`${each.name}: ${can ? '할 수 있음' : '할 수 없음'}`}>
              {can ? <CheckIcon className="size-4" /> : <span className="text-muted-foreground">–</span>}
            </span>;
          })}
        </div>)}
      </div>
    </SettingsSection>
  </SettingsPage>;
}
