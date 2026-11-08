import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { ListItem } from '@astryxdesign/core/List';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { Page } from '@kit/layouts/page/Page';
import { PageBanner, PageList } from '@kit/layouts/page/PageParts';
import { useState } from 'react';
import { useWorkspace, useWorkspaceActions } from '../../entities/workspace';
import { InviteDialog, ProjectDialog } from '../dialogs/Dialogs';
import { FirstRun } from './FirstRun';

/**
 * 프로젝트 첫 화면. 프로젝트가 없으면 시작 선택지(FirstRun)를, 생기면 목록을 보인다. 견본으로 채웠다면 목록 위 배너에서
 * 그 견본만 되돌릴 수 있다. 상태 순서: 대기 → 실패 → 빈 작업 공간 → 목록.
 */
export function HomePage() {
  const query = useWorkspace();
  const { fillSample, undoSample } = useWorkspaceActions();
  const [dialog, setDialog] = useState<'project' | 'invite' | null>(null);
  const [isNoticeClosed, setNoticeClosed] = useState(false);
  const projects = query.data?.projects ?? [];
  const sampleCount = projects.filter(project => project.isSample).length;
  const content = () => {
    if (query.isPending) return <Center height="100%"><Spinner label="프로젝트를 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="프로젝트를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (projects.length === 0) return <FirstRun isFilling={fillSample.isPending} onCreate={() => setDialog('project')} onInvite={() => setDialog('invite')}
      onSample={() => { setNoticeClosed(false); fillSample.mutate(); }} />;
    return <PageList hasDividers aria-label="프로젝트">
      {projects.map(project => <ListItem key={project.id} label={<Text weight="medium" maxLines={1}>{project.name}</Text>} startContent={icon('folder')}
        endContent={project.isSample ? <Badge label="견본" variant="neutral" /> : undefined} />)}
    </PageList>;
  };
  return <Page crumbs={[{ label: '프로젝트' }]} create={{ label: '프로젝트 만들기', onClick: () => setDialog('project') }}>
    {sampleCount > 0 && !isNoticeClosed
      ? <PageBanner status="info" title={`견본 프로젝트 ${sampleCount}개로 시작했습니다`} description="실제 데이터가 아닙니다. 필요 없으면 되돌릴 수 있습니다."
        isDismissable onDismiss={() => setNoticeClosed(true)}
        endContent={<Button label="되돌리기" variant="secondary" size="sm" isLoading={undoSample.isPending} onClick={() => undoSample.mutate()} />} />
      : null}
    {fillSample.isError ? <PageBanner status="error" title="견본을 채우지 못했습니다" description="잠시 후 다시 시도해 주세요." /> : null}
    {content()}
    {dialog === 'project' ? <ProjectDialog onClose={() => setDialog(null)} /> : null}
    {dialog === 'invite' ? <InviteDialog onClose={() => setDialog(null)} /> : null}
  </Page>;
}
