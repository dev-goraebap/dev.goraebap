import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { HStack } from '@astryxdesign/core/HStack';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { Page } from '@kit/layouts/page/Page';
import { PageBanner } from '@kit/layouts/page/PageParts';
import { useState } from 'react';
import { steps, useWorkspace, useWorkspaceActions, type StepId, type StepState } from '../../entities/workspace';
import { InviteDialog, ProjectDialog } from '../dialogs/Dialogs';
import styles from '../../app/onboarding.module.css';

const markOf: Record<StepState, ReturnType<typeof icon>> = { done: icon('check'), later: icon('clock'), todo: <span className={styles.ring} /> };

/**
 * 설정 체크리스트. 위에 진행 표시, 아래에 단계 목록. 하나씩 마치면 체크되고 진행이 오른다. 급하지 않은 단계는 "나중에 하기"로
 * 미뤄 두었다가 같은 자리에서 다시 할 수 있다. 미룬 단계는 마친 것으로 세지 않는다.
 */
export function SetupPage({ onFinish }: { onFinish: () => void }) {
  const query = useWorkspace();
  const actions = useWorkspaceActions();
  const [dialog, setDialog] = useState<'project' | 'invite' | null>(null);
  const workspace = query.data;
  if (query.isPending) return <Page crumbs={[{ label: '시작하기' }]}><Center height="100%"><Spinner label="진행 상황을 불러오는 중" /></Center></Page>;
  if (!workspace) return <Page crumbs={[{ label: '시작하기' }]}>
    <PageState kind="error" title="진행 상황을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />
  </Page>;
  const done = steps.filter(step => workspace.steps[step.id] === 'done').length;
  const isAllDone = done === steps.length;
  const start = (id: StepId) => {
    if (id === 'project') setDialog('project');
    else if (id === 'invite') setDialog('invite');
    else actions.enableNotify.mutate();
  };
  return <Page crumbs={[{ label: '시작하기' }]}>
    {actions.enableNotify.isError ? <PageBanner status="error" title="알림을 켜지 못했습니다" description="잠시 후 다시 시도해 주세요." /> : null}
    <VStack className={styles.column} gap={6}>
      <ProgressBar label="시작하기 진행" value={done} max={steps.length} hasValueLabel formatValueLabel={(value, max) => `${max}단계 중 ${value}단계 완료`} />
      <ol className={styles.steps} aria-label="시작하기 단계">
        {steps.map(step => {
          const state = workspace.steps[step.id];
          const isBusy = step.id === 'notify' && actions.enableNotify.isPending;
          return <li key={step.id} className={styles.step} data-state={state} aria-labelledby={`step-${step.id}`}>
            <span className={styles.stepMark} data-state={state} aria-hidden="true">{markOf[state]}</span>
            <VStack className={styles.stepText} gap={0.5}>
              <Text id={`step-${step.id}`} weight="semibold">{step.title}</Text>
              <Text color="secondary">{state === 'later' ? '나중에 하기로 했습니다.' : step.description}</Text>
            </VStack>
            <HStack className={styles.stepEnd} gap={2} vAlign="center">
              {state === 'done' ? <Text type="supporting" color="secondary">완료</Text> : <>
                {state === 'todo' ? <Button label="나중에 하기" variant="ghost" onClick={() => actions.setLater.mutate({ step: step.id, isLater: true })} /> : null}
                <Button label={step.action} variant={state === 'todo' ? 'secondary' : 'ghost'} isLoading={isBusy} onClick={() => start(step.id)} />
              </>}
            </HStack>
          </li>;
        })}
      </ol>
      {isAllDone ? <HStack gap={3} vAlign="center" hAlign="between" wrap="wrap">
        <Text role="status">모든 단계를 마쳤습니다.</Text>
        <Button label="프로젝트 보기" variant="primary" onClick={onFinish} />
      </HStack> : null}
    </VStack>
    {dialog === 'project' ? <ProjectDialog onClose={() => setDialog(null)} /> : null}
    {dialog === 'invite' ? <InviteDialog onClose={() => setDialog(null)} /> : null}
  </Page>;
}
