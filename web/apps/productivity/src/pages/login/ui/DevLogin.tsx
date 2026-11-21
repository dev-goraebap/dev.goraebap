import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getJson, sendCommand } from '@/shared/api';
import { AdaptivePopover } from '@/shared/ui/kit/adaptive-popover';
import { Button } from '@/shared/ui/kit/button';
import { ChevronDownIcon } from '@/shared/ui/kit/icon';
import { OptionList } from '@/shared/ui/kit/option-list';
import { Spinner } from '@/shared/ui/kit/spinner';

/** The development login API, served only locally and on hr-dev (dev or qa profile), so not in the published contract. */
type DevEmployee = { id: string; name: string; email: string };

/** Signing in as any member in development: pick them (found by name or email), then 개발 로그인. Nothing where the server does not offer it. */
export function DevLogin({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const [userId, setUserId] = useState<string>();
  const [isPicking, setPicking] = useState(false);
  const employees = useQuery({ queryKey: ['dev-employees'], queryFn: ({ signal }) => getJson<DevEmployee[]>('/api/v1/auth/dev/employees', signal), retry: false });
  const login = useMutation({ mutationFn: () => sendCommand('/api/v1/auth/dev/login', 'POST', { userId }), onSuccess: onSignedIn });
  if (!employees.data?.length) return null;
  const options = employees.data.map(employee => ({ value: employee.id, label: `${employee.name} (${employee.email})` }));
  const chosen = options.find(option => option.value === userId);
  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <span id="dev-login-label" className="text-sm font-medium">개발 환경 사용자</span>
      <AdaptivePopover title="개발 환경 사용자" open={isPicking} onOpenChange={setPicking} className="w-(--anchor-width) min-w-72 p-1.5"
        trigger={
          <Button variant="outline" size="lg" aria-labelledby="dev-login-label" data-empty={!chosen || undefined}
            className="w-full justify-between px-3 font-normal data-empty:text-muted-foreground max-md:h-11">
            <span className="truncate">{chosen?.label ?? '구성원을 고르세요'}</span>
            <ChevronDownIcon data-icon="inline-end" />
          </Button>
        }>
        <OptionList label="개발 환경 사용자" isSearchable options={options} chosen={userId ? [userId] : []}
          onPick={value => { setUserId(value); setPicking(false); }} />
      </AdaptivePopover>
      <Button variant="view" className="w-full max-md:h-11" disabled={!userId || login.isPending} onClick={() => login.mutate()}>
        {login.isPending ? <Spinner data-icon="inline-start" /> : null}개발 로그인
      </Button>
      {login.error ? <p role="alert" className="text-sm text-muted-foreground">{login.error.message}</p> : null}
    </div>
  );
}
