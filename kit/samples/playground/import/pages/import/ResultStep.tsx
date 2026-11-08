import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useImportSession } from '../../app/session';
import { errorsCsv, readRows } from '../../entities/csv';
import { customerKeys, useCustomerApi } from '../../entities/customer';
import styles from './import.module.css';

/** 오류 행을 CSV 파일로 내려받는다. */
function downloadErrors(rows: ReturnType<typeof readRows>) {
  const url = URL.createObjectURL(new Blob(['﻿', errorsCsv(rows)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = '가져오지 못한 행.csv';
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 4단계. 들어오면 가져오기를 시작하고 진행을 알린다(행 수 기준). 끝나면 가져온 수와 건너뛴 수, 건너뛴 행의 목록 내려받기를
 * 보인다. 실패하면 지금까지의 상태를 지키고 다시 시도를 권한다. 이미 끝난 결과가 있으면(견본·되돌아옴) 다시 가져오지 않는다.
 */
export function ResultStep({ onRetreat }: { onRetreat: () => void }) {
  const api = useCustomerApi();
  const client = useQueryClient();
  const { session, update } = useImportSession();
  const [done, setDone] = useState(0);
  const started = useRef(false);
  const rows = readRows(session.mapping);
  const valid = rows.filter(row => !row.errors.length);
  const skipped = rows.filter(row => row.errors.length);
  const run = useMutation({
    mutationFn: () => { setDone(0); return api.importRows(valid.map(row => row.values), setDone); },
    onSuccess: async ({ imported }) => { update({ result: { imported, skipped } }); await client.invalidateQueries({ queryKey: customerKeys.all }); },
  });
  useEffect(() => {
    if (session.result || started.current) return;
    started.current = true;
    run.mutate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (run.isError) return <PageState kind="error" isCompact title="가져오지 못했습니다" description={`${done}행까지 가져왔습니다. 다시 시도하면 처음부터 가져옵니다.`}
    action={<HStack gap={2}><Button label="이전 단계로" variant="ghost" onClick={onRetreat} /><Button label="다시 시도" variant="secondary" onClick={() => run.mutate()} /></HStack>} />;
  if (!session.result) return <VStack gap={3} role="status">
    <Text weight="semibold">가져오는 중입니다</Text>
    <ProgressBar label="가져오는 중" isLabelHidden value={Math.round((done / Math.max(valid.length, 1)) * 100)} />
    <Text type="supporting" color="secondary" hasTabularNumbers>{valid.length}행 중 {done}행</Text>
  </VStack>;
  const { imported, skipped: left } = session.result;
  return <VStack gap={5}>
    <HStack gap={2} vAlign="center"><span className={styles.done}>{icon('done', true)}</span><Text weight="semibold" size="lg">가져오기를 마쳤습니다</Text></HStack>
    <HStack gap={6} role="group" aria-label="가져오기 결과">
      <VStack gap={1}><Text type="supporting" color="secondary">가져온 행</Text><Text size="xl" weight="semibold" hasTabularNumbers>{imported}</Text></VStack>
      <VStack gap={1}><Text type="supporting" color="secondary">건너뛴 행</Text><Text size="xl" weight="semibold" hasTabularNumbers>{left.length}</Text></VStack>
    </HStack>
    {left.length ? <VStack gap={2} hAlign="start">
      <Text color="secondary">건너뛴 행은 이유와 함께 파일로 받아 고친 뒤 다시 가져올 수 있습니다.</Text>
      <Button label="오류 목록 내려받기" variant="secondary" icon={icon('download')} onClick={() => downloadErrors(left)} />
    </VStack> : null}
  </VStack>;
}
