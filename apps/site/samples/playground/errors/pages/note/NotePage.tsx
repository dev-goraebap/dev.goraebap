import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { focusFirstInvalid } from '@/shared/lib/focus-invalid';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Field, FieldError, FieldLabel } from '@/shared/ui/field';
import { TriangleAlertIcon } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { Page } from '@/shared/ui/page';
import { Spinner } from '@/shared/ui/spinner';
import { Textarea } from '@/shared/ui/textarea';
import { useGuard, useSessionApi } from '../../entities/session';

const seedBody = '이번 분기에 잘 된 일과 아쉬웠던 일을 나눠 적습니다.\n\n- 잘 된 일: 화면 규칙을 한 곳에 모았다.\n- 아쉬운 일: 오류 화면의 문구가 제각각이었다.';

/**
 * 메모 쓰기. 저장하다 세션이 끝나면 화면을 떠나지 않고 다시 로그인 화면이 열린다(SessionGate). 로그인하면 같은
 * 저장이 이어지고 쓰던 제목과 본문은 그대로다. 저장은 데스크톱 머리 줄, 휴대폰은 바닥 줄(본문 수정 화면과 같은 자리)이다.
 */
export function NotePage() {
  const api = useSessionApi();
  const guard = useGuard();
  const isMobile = useIsMobile();
  const [title, setTitle] = useState('분기 회고');
  const [body, setBody] = useState(seedBody);
  const [isSaved, setSaved] = useState(false);
  const [isTried, setTried] = useState(false);
  // 화면을 열 때 세션을 확인한다. 이미 끝났으면 쓰기 전에 다시 로그인하게 된다.
  useEffect(() => { void guard(() => api.ping()).catch(() => {}); }, [api, guard]);
  const save = useMutation({
    mutationFn: () => guard(() => api.saveNote({ title: title.trim(), body })),
    onSuccess: () => setSaved(true),
  });
  const submit = () => {
    if (!title.trim()) { setTried(true); focusFirstInvalid(); return; }
    save.mutate();
  };
  const titleError = isTried && !title.trim() ? '제목을 입력해 주세요.' : undefined;
  const status = isSaved && !save.isPending ? <span role="status" className="text-xs text-muted-foreground max-md:mr-auto max-md:text-sm">저장됨</span> : null;
  const saveButton = <Button className="max-md:h-11 max-md:flex-1" disabled={save.isPending} onClick={submit}>
    {save.isPending && <Spinner data-icon="inline-start" />}저장
  </Button>;
  return <Page crumbs={[{ label: '메모', href: '/notes/new' }, { label: title.trim() || '새 메모' }]} isFullScreen
    actions={isMobile ? undefined : <div className="flex shrink-0 items-center gap-2">{status}{saveButton}</div>}
    below={save.isError ? <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
      <TriangleAlertIcon />
      <AlertTitle>저장하지 못했습니다</AlertTitle>
      <AlertDescription>입력한 내용은 그대로 있습니다. 잠시 후 다시 시도해 주세요.</AlertDescription>
    </Alert> : undefined}>
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-180 flex-col gap-4 px-4 py-5 md:px-6 md:py-8">
        <Field data-invalid={!!titleError || undefined}>
          <FieldLabel htmlFor="note-title">제목</FieldLabel>
          <Input id="note-title" value={title} aria-invalid={!!titleError || undefined} aria-describedby={titleError ? 'note-title-error' : undefined}
            onChange={event => { setTitle(event.target.value); setSaved(false); }} />
          <FieldError id="note-title-error">{titleError}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="note-body">본문</FieldLabel>
          <Textarea id="note-body" rows={10} className="min-h-60" value={body} onChange={event => { setBody(event.target.value); setSaved(false); }} />
        </Field>
      </div>
    </div>
    {isMobile && <footer className="sticky bottom-0 flex shrink-0 items-center gap-2 border-t bg-background px-4 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{status}{saveButton}</footer>}
  </Page>;
}
