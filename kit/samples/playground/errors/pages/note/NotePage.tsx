import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { Button } from '@astryxdesign/core/Button';
import { Page } from '@kit/layouts/page/Page';
import { PageActions, PageBanner } from '@kit/layouts/page/PageParts';
import { focusFirstInvalid } from '@kit/patterns/compose/validation';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useGuard, useSessionApi } from '../../entities/session';
import styles from '../../app/errors.module.css';

const seedBody = '이번 분기에 잘 된 일과 아쉬웠던 일을 나눠 적습니다.\n\n- 잘 된 일: 화면 규칙을 한 곳에 모았다.\n- 아쉬운 일: 오류 화면의 문구가 제각각이었다.';

/**
 * 메모 쓰기. 저장하다 세션이 끝나면 화면을 떠나지 않고 다시 로그인 대화상자가 열린다(SessionGate). 로그인하면 같은
 * 저장이 이어지고 쓰던 제목과 본문은 그대로다.
 */
export function NotePage() {
  const api = useSessionApi();
  const guard = useGuard();
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
  return <Page crumbs={[{ label: '메모' }, { label: title.trim() || '새 메모' }]} isDetail hasPattern={false}
    pageActions={isSaved && !save.isPending ? <Text type="supporting" color="secondary" role="status">저장됨</Text> : undefined}>
    {save.isError ? <PageBanner status="error" title="저장하지 못했습니다" description="입력한 내용은 그대로 있습니다. 잠시 후 다시 시도해 주세요." /> : null}
    <VStack className={styles.column} gap={4}>
      <TextInput label="제목" value={title} onChange={value => { setTitle(value); setSaved(false); }}
        status={isTried && !title.trim() ? { type: 'error', message: '제목을 입력해 주세요.' } : undefined} />
      <TextArea label="본문" rows={10} value={body} onChange={value => { setBody(value); setSaved(false); }} />
    </VStack>
    <PageActions><Button label="저장" variant="primary" isLoading={save.isPending} onClick={submit} /></PageActions>
  </Page>;
}
