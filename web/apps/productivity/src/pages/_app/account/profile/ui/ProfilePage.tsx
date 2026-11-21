import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PictureDialog } from '@/features/picture-change';
import { sessionOptions } from '@/shared/auth';
import { Button } from '@/shared/ui/kit/button';
import { Field, FieldLabel } from '@/shared/ui/kit/field';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { GalleryEditIcon, PencilIcon } from '@/shared/ui/kit/icon';
import { Input } from '@/shared/ui/kit/input';
import { PersonAvatar } from '@/shared/ui/person';
import { SettingsPage, SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { changeMyName } from '../api/profile';

type Crumb = { label: string; href?: string; icon?: string };

/** 내 정보: 다른 사람에게 보이는 사진과 이름을 바꾸고, 로그인하는 이메일을 본다. */
export function ProfilePage({ crumbs }: { crumbs: Crumb[] }) {
  const me = useQuery(sessionOptions()).data;
  const [editing, setEditing] = useState<'picture' | 'name'>();
  return (
    <SettingsPage crumbs={pageCrumbs(crumbs)} title="내 정보">
      {!me?.id ? null : <>
        <SettingsSection title="프로필" action={
          <Button variant="secondary" size="sm" onClick={() => setEditing('picture')}>
            <GalleryEditIcon data-icon="inline-start" />사진 바꾸기
          </Button>
        }>
          <div className="flex min-h-11 items-center gap-3 p-3">
            <button type="button" aria-label="사진 바꾸기" onClick={() => setEditing('picture')}
              className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <PersonAvatar id={me.id} name={me.name ?? ''} size={40} isStatic />
            </button>
            <span className="min-w-0 flex-1 truncate font-medium">{me.name}</span>
          </div>
          <SettingsRow label="이름" description={me.name}>
            <Button variant="secondary" size="sm" onClick={() => setEditing('name')}>
              <PencilIcon data-icon="inline-start" />이름 바꾸기
            </Button>
          </SettingsRow>
          <SettingsRow label="이메일" description="로그인할 때 이 주소로 인증 코드를 받습니다.">
            <span className="text-right">{me.email}</span>
          </SettingsRow>
        </SettingsSection>
        {editing === 'picture' ? <PictureDialog employeeId={me.id} name={me.name ?? ''} onClose={() => setEditing(undefined)} /> : null}
        {editing === 'name' ? <NameDialog name={me.name ?? ''} onClose={() => setEditing(undefined)} /> : null}
      </>}
    </SettingsPage>
  );
}

function NameDialog({ name, onClose }: { name: string; onClose: () => void }) {
  const client = useQueryClient();
  const [value, setValue] = useState(name);
  const save = useMutation({
    mutationFn: () => changeMyName(value.trim()),
    onSuccess: async () => {
      await Promise.all([client.invalidateQueries({ queryKey: sessionOptions().queryKey }), client.invalidateQueries({ queryKey: ['departments'] })]);
      onClose();
    },
  });
  return (
    <FormDialog open onOpenChange={open => { if (!open) onClose(); }} title="이름 바꾸기" submitLabel="저장"
      isPending={save.isPending} isSubmitDisabled={!value.trim() || value.trim() === name} onSubmit={() => save.mutate()}>
      <Field>
        <FieldLabel htmlFor="my-name">이름</FieldLabel>
        <Input id="my-name" autoComplete="name" maxLength={64} autoFocus value={value} onChange={event => setValue(event.target.value)} />
      </Field>
      {save.error ? <p role="alert" className="text-sm text-destructive">{save.error.message}</p> : null}
    </FormDialog>
  );
}
