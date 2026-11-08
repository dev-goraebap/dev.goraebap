import { Button } from '@astryxdesign/core/Button';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Step, Stepper } from '@astryxdesign/core/Stepper';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { AlertDialog } from '@kit/composites/dialog/AlertDialog';
import { focusFirstInvalid } from '@kit/patterns/compose/validation';
import { Page } from '@kit/layouts/page/Page';
import { useIsPhone } from '@kit/foundations/media';
import { PageActions } from '@kit/layouts/page/PageParts';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useImportSession } from '../../app/session';
import { readRows } from '../../entities/csv';
import { fields } from '../../entities/customer';
import { MapStep, UploadStep } from './FileSteps';
import { PreviewStep } from './PreviewStep';
import { ResultStep } from './ResultStep';
import styles from './import.module.css';

const steps = [
  { id: 'upload', label: '파일', path: '/import' },
  { id: 'map', label: '열 맞추기', path: '/import/map' },
  { id: 'preview', label: '미리보기', path: '/import/preview' },
  { id: 'result', label: '결과', path: '/import/result' },
] as const;

/**
 * 고객 가져오기(CSV): 파일 → 열 맞추기 → 미리보기 → 결과의 단계형. 단계는 주소가 가지고 입력 값은 단계를 오가도 남는다. 바닥
 * 줄에는 취소 · 이전 · 다음만 두고, 빠진 것은 해당 칸 곁에 알린다(버튼은 막지 않는다). 파일이 없으면 처음 단계로 돌아간다.
 */
export function ImportPage() {
  const navigate = useNavigate();
  const isPhone = useIsPhone();
  const { session, update, reset } = useImportSession();
  const stepId = useLocation().pathname.split('/')[2] ?? 'upload';
  const step = steps.findIndex(each => each.id === stepId);
  const current = steps[Math.max(step, 0)];
  const [isTried, setTried] = useState(false);
  const [isLeaving, setLeaving] = useState(false);
  useEffect(() => setTried(false), [step]);
  const needsFile = current.id !== 'upload' && !session.file;
  useEffect(() => { if (needsFile) void navigate({ href: '/import', replace: true }); }, [needsFile, navigate]);
  const go = (path: string) => void navigate({ href: path });
  const leave = () => { reset(); go('/customers'); };
  const missing = fields.some(field => field.isRequired && session.mapping[field.id] === null);
  const hasErrors = readRows(session.mapping).some(row => row.errors.length);
  const next = () => {
    const blocked = current.id === 'upload' ? !session.file : current.id === 'map' ? missing : current.id === 'preview' ? hasErrors && !session.skipErrors : false;
    if (blocked) { setTried(true); focusFirstInvalid(); return; }
    if (current.id === 'preview') update({ result: undefined });
    go(steps[step + 1].path);
  };
  if (needsFile) return null;
  return <Page crumbs={[{ label: '고객', href: '/customers' }, { label: '고객 가져오기' }]} isDetail hasPattern={false}
    onBack={() => go('/customers')}>
    <VStack className={styles.column} data-wide={current.id === 'preview' || undefined} gap={6}>
      {isPhone
        ? <VStack gap={2} role="group" aria-label="가져오기 단계">
          <Text weight="semibold" hasTabularNumbers>{step + 1}/{steps.length} {current.label}</Text>
          <ProgressBar label="가져오기 진행" isLabelHidden value={((step + 1) / steps.length) * 100} />
        </VStack>
        : <Stepper activeStep={step} label="가져오기 단계" density="compact">
          {steps.map((each, index) => <Step key={each.id} step={index} label={each.label} />)}
        </Stepper>}
      {current.id === 'upload' ? <UploadStep isTried={isTried} /> : null}
      {current.id === 'map' ? <MapStep isTried={isTried} /> : null}
      {current.id === 'preview' ? <PreviewStep isTried={isTried} /> : null}
      {current.id === 'result' ? <ResultStep onRetreat={() => go('/import/preview')} /> : null}
    </VStack>
    {current.id === 'result'
      ? session.result ? <PageActions><Button label="완료" variant="primary" onClick={leave} /></PageActions> : null
      : <PageActions>
        <Button label="취소" variant="ghost" onClick={() => (session.file ? setLeaving(true) : leave())} />
        {step > 0 ? <Button label="이전" variant="secondary" onClick={() => go(steps[step - 1].path)} /> : null}
        <Button label={current.id === 'preview' ? '가져오기' : '다음'} variant="primary" onClick={next} />
      </PageActions>}
    <AlertDialog isOpen={isLeaving} onOpenChange={setLeaving} title="가져오기를 그만둘까요?" description="올린 파일과 맞춘 열이 사라집니다."
      cancelLabel="계속하기" actionLabel="그만두기" onAction={() => { setLeaving(false); leave(); }} />
  </Page>;
}
