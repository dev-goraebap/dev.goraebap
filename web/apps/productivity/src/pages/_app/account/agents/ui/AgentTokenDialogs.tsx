import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/shared/ui/kit/button';
import { DEFAULT_MARK_COLOR } from '@/shared/ui/color-palette';
import { DatePicker } from '@/shared/ui/kit/date-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/kit/dialog';
import { Field, FieldError, FieldLabel } from '@/shared/ui/kit/field';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { MarkNameField, type MarkValue } from '@/shared/ui/mark-picker';
import { createAgentToken, editAgentProfile, type AgentProfile, type AgentTokenCreated } from '../api/agents';
import { CodeBlock } from './CodeBlock';

/** A day as YYYY-MM-DD, as the server takes an expiry. */
const seoulDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
const defaultExpiry = () => {
  const date = new Date(`${seoulDate.format()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 90);
  return date.toISOString().slice(0, 10);
};

/**
 * The token just made, shown this once with how to give it to Claude Code (the MCP server). Closing drops the token from
 * the page.
 */
export function AgentTokenSecretDialog({ created, onClose }: { created: AgentTokenCreated | null; onClose: () => void }) {
  const origin = window.location.origin;
  return (
    <Dialog open={!!created} onOpenChange={open => { if (!open) onClose(); }}>
      {created ? (
        <DialogContent className="overflow-y-auto">
          <DialogHeader>
            <DialogTitle>토큰을 복사하세요</DialogTitle>
            <DialogDescription>이 창을 닫으면 토큰을 다시 볼 수 없습니다.</DialogDescription>
          </DialogHeader>
          <div className="flex min-w-0 flex-col gap-4">
            <CodeBlock title={`${created.token.agentName} 토큰`} code={created.secret} />
            <CodeBlock title="Claude Code에 MCP 서버 연결"
              code={`claude mcp add --transport http cowork ${origin}/api/mcp --header "Authorization: Bearer ${created.secret}"`} />
          </div>
          <DialogFooter>
            <Button onClick={onClose}>복사했어요</Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

export function AgentEditorDialog({ profile, isEditing, onClose, onSaved, onCreated }: {
  profile?: AgentProfile; isEditing: boolean; onClose: () => void; onSaved: () => void;
  onCreated: (created: AgentTokenCreated) => void;
}) {
  const [name, setName] = useState(profile?.name ?? '');
  const [mark, setMark] = useState<MarkValue>({ icon: profile?.icon ?? 'agent', color: profile?.color ?? DEFAULT_MARK_COLOR });
  const [expiresOn, setExpiresOn] = useState<string | undefined>(defaultExpiry);
  const today = seoulDate.format();
  // The calendar offers every day; a day before today is said under it and keeps 만들기 off.
  const isPastExpiry = !!expiresOn && expiresOn < today;
  const validExpiry = !!expiresOn && !isPastExpiry;
  const save = useMutation({
    mutationFn: async () => {
      const input = { name: name.trim(), icon: mark.icon ?? 'agent', color: mark.color ?? DEFAULT_MARK_COLOR };
      if (isEditing && profile) {
        await editAgentProfile(profile, input);
        return;
      }
      return createAgentToken({ ...input, expiresOn, profileId: profile?.id });
    },
    onSuccess: made => { if (made) onCreated(made); else onSaved(); },
  });
  return (
    <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title={isEditing ? '에이전트 수정' : '에이전트 추가'}
      submitLabel={isEditing ? '저장' : '만들기'} isPending={save.isPending} isSubmitDisabled={!name.trim() || (!isEditing && !validExpiry)}
      onSubmit={() => save.mutate()}>
      <MarkNameField
        mark={{ label: '에이전트 아이콘과 색상', value: mark, onChange: setMark, isDisabled: save.isPending }}
        input={{ label: '에이전트 이름', placeholder: '에이전트 이름', value: name, isRequired: true, hasAutoFocus: true,
          onChange: value => setName(value.slice(0, 64)), isDisabled: save.isPending }} />
      {isEditing ? null : (
        <Field data-invalid={isPastExpiry || undefined}>
          <FieldLabel htmlFor="agent-token-expiry">만료일</FieldLabel>
          <DatePicker id="agent-token-expiry" label="만료일" value={expiresOn} onChange={setExpiresOn} />
          {isPastExpiry ? <FieldError>오늘이나 그 뒤의 날을 골라 주세요.</FieldError> : null}
        </Field>
      )}
      {save.error ? <p role="alert" className="text-sm text-destructive">{save.error.message}</p> : null}
    </FormDialog>
  );
}
