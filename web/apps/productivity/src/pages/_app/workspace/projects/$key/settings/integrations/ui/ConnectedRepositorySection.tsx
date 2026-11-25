import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { disconnectRepository, providerName, refreshCode, type CodeIntegration } from '@/entities/work-item';
import { Button } from '@goraebap/ui-react/compact/button';
import { ConfirmDialog } from '@/shared/ui/kit/confirm-dialog';
import { CopyIcon, EyeClosedIcon, EyeIcon, SquareArrowOutUpRightIcon } from '@/shared/ui/kit/icon';
import { SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';
import { toast } from '@goraebap/ui-react/compact/toast';
import { IconAction } from '@/shared/ui/settings';
import { RepositoryTokenDialog } from './RepositoryTokenDialog';

const when = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });
/** 웹훅 주소 · 비밀값: 줄에 맞춰 자른 고정폭 글자. */
const CODE_VALUE = 'min-w-0 truncate font-mono text-xs text-muted-foreground md:max-w-64 max-md:flex-1 max-md:text-sm';

/** One connected repository: where, whose token, the webhook (registered, or its address and secret), and the way off. */
export function ConnectedRepositorySection({ projectKey, integration }: { projectKey: string; integration: CodeIntegration }) {
  const client = useQueryClient();
  const [isToken, setToken] = useState(false);
  const [isAsking, setAsking] = useState(false);
  const [isShown, setShown] = useState(false);
  const remove = useMutation({
    mutationFn: () => disconnectRepository(projectKey, integration),
    onSuccess: () => setAsking(false), onSettled: () => refreshCode(client),
  });
  const name = providerName(integration.provider);
  const isGitLab = integration.provider === 'gitlab';
  const copy = (value: string, what: string) => void navigator.clipboard?.writeText(value)
    .then(() => toast.add({ title: `${what}을 복사했습니다.` }), () => toast.add({ type: 'error', title: '복사하지 못했습니다.' }));
  const heard = integration.lastEventAt ? `마지막으로 받은 웹훅 ${when.format(new Date(integration.lastEventAt))}` : '아직 받은 웹훅이 없습니다';
  return <SettingsSection title={`${name} · ${integration.repository}`}>
    <SettingsRow wide
      label={<a href={integration.webUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
        {integration.repository}<SquareArrowOutUpRightIcon className="size-3.5 text-icon-muted" />
      </a>}
      description={integration.hasToken
        ? integration.accountLogin ? `${integration.accountLogin} 계정의 토큰으로 연결했습니다.` : '토큰으로 연결했습니다.'
        : '토큰 없이 연결했습니다. 웹훅은 저장소에 직접 등록합니다.'}>
      <Button variant="secondary" size="sm" className="max-md:h-11" onClick={() => setToken(true)}>{integration.hasToken ? '토큰 바꾸기' : '토큰 넣기'}</Button>
    </SettingsRow>
    {integration.webhookRegistered
      ? <SettingsRow hasValue={false} label="웹훅" description={`서버가 저장소에 직접 등록했습니다. ${heard}.`} />
      : <>
        <SettingsRow wide label="웹훅 주소"
          description={`${name} 저장소 설정의 Webhooks에 이 주소와 아래 비밀값을 넣고, Push와 ${isGitLab ? 'Merge request' : 'Pull request'} 이벤트를 고릅니다(JSON). ${heard}.`}>
          <div className="flex min-w-0 items-center gap-1">
            <code className={CODE_VALUE}>{integration.webhookUrl}</code>
            <IconAction label="웹훅 주소 복사" tooltip="복사" onClick={() => copy(integration.webhookUrl, '웹훅 주소')}><CopyIcon /></IconAction>
          </div>
        </SettingsRow>
        <SettingsRow wide label={isGitLab ? 'Secret token' : 'Secret'}>
          <div className="flex min-w-0 items-center gap-1">
            <code className={CODE_VALUE}>{isShown ? integration.webhookSecret ?? '' : '••••••••••••'}</code>
            <IconAction label={isShown ? '비밀값 숨기기' : '비밀값 보기'} tooltip={isShown ? '숨기기' : '보기'} onClick={() => setShown(!isShown)}>
              {isShown ? <EyeClosedIcon /> : <EyeIcon />}
            </IconAction>
            <IconAction label="비밀값 복사" tooltip="복사" onClick={() => copy(integration.webhookSecret ?? '', '비밀값')}><CopyIcon /></IconAction>
          </div>
        </SettingsRow>
      </>}
    {integration.lastError ? <SettingsRow hasValue={false} label="최근 오류" description={integration.lastError} /> : null}
    <SettingsRow label="연결 끊기">
      <Button variant="destructive" size="sm" className="max-md:h-11" onClick={() => { remove.reset(); setAsking(true); }}>연결 끊기</Button>
    </SettingsRow>
    {isToken ? <RepositoryTokenDialog projectKey={projectKey} integration={integration} onClose={() => setToken(false)} /> : null}
    <ConfirmDialog open={isAsking} onOpenChange={setAsking} title={`${name} 연결을 끊을까요?`}
      description={remove.error?.message ?? `${integration.repository}와의 연결과 업무에 이어진 코드 기록이 지워집니다. 다시 연결하면 새로 쌓입니다.`}
      action={{ label: '연결 끊기', isPending: remove.isPending, onAction: () => remove.mutate() }} />
  </SettingsSection>;
}
