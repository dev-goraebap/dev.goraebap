import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { refreshCode, reviseIntegration, type CodeIntegration } from '@/entities/work-item';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { TextField } from '@/shared/ui/settings';

/** A new token for a connection, checked with the host before it is kept. */
export function RepositoryTokenDialog({ projectKey, integration, onClose }: { projectKey: string; integration: CodeIntegration; onClose: () => void }) {
  const client = useQueryClient();
  const [token, setToken] = useState('');
  const save = useMutation({
    mutationFn: () => reviseIntegration(projectKey, integration, token.trim()),
    onSuccess: onClose, onSettled: () => refreshCode(client),
  });
  return <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={integration.hasToken ? '토큰 바꾸기' : '토큰 넣기'}
    description={integration.repository} submitLabel="저장" isPending={save.isPending} isSubmitDisabled={!token.trim()} onSubmit={() => save.mutate()}>
    <TextField label="토큰" type="password" placeholder="새 토큰 붙여 넣기" value={token} onChange={setToken} isRequired autoFocus />
    {save.error ? <p role="alert" className="text-sm text-destructive">{save.error.message}</p> : null}
  </FormDialog>;
}
