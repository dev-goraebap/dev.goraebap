import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CODE_PROVIDERS, connectRepository, refreshCode, type CodeProvider } from '@/entities/work-item';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { TextField } from '@/shared/ui/settings';

/** 연결: the host's address (GitLab, GitHub by default; Gitea always), the repository, and a token or none. */
export function ConnectRepositoryDialog({ projectKey, provider, onClose }: { projectKey: string; provider: CodeProvider; onClose: () => void }) {
  const client = useQueryClient();
  const host = CODE_PROVIDERS.find(each => each.value === provider)!;
  const [baseUrl, setBaseUrl] = useState(provider === 'gitlab' ? 'https://gitlab.com' : '');
  const [repository, setRepository] = useState('');
  const [token, setToken] = useState('');
  const connect = useMutation({
    mutationFn: () => connectRepository(projectKey, {
      provider, baseUrl: baseUrl.trim() || undefined, repository: repository.trim(), token: token.trim() || undefined,
    }),
    onSuccess: onClose, onSettled: () => refreshCode(client),
  });
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={`${host.label} 저장소 연결`} description={host.hint} submitLabel="연결하기"
    isPending={connect.isPending} isSubmitDisabled={!repository.trim() || (provider === 'gitea' && !baseUrl.trim())} onSubmit={() => connect.mutate()}>
    <TextField label="주소" value={baseUrl} onChange={setBaseUrl} isRequired={provider === 'gitea'}
      placeholder={host.defaultUrl ?? 'https://git.example.com'} />
    <TextField label="저장소" value={repository} onChange={setRepository} isRequired autoFocus
      placeholder={provider === 'gitlab' ? 'group/project' : 'owner/repository'} />
    <TextField label="토큰" type="password" placeholder="비워 두어도 됩니다" value={token} onChange={setToken} isOptional
      description="비우면 연결한 뒤 웹훅을 저장소에 직접 등록합니다." />
    {connect.error ? <p role="alert" className="text-sm text-destructive">{connect.error.message}</p> : null}
  </FormDialog>;
}
