import { formatHours, STORY_POINTS, type WorkItemDraft, type WorkItemRow } from '@/entities/work-item';
import { ChartNoAxesColumnIcon, ClockIcon } from '@/shared/ui/kit/icon';
import { InfoPill } from '@/shared/ui/kit/info-pill';
import { OptionPill, PropertyPill } from '@/shared/ui/kit/property-pill';
import { WorkItemEstimateForm } from './WorkItemEstimateForm';
import { WorkItemTimeLog } from './WorkItemTimeLog';

/**
 * A work item's effort (레드마인의 추정시간·스토리 포인트·소요시간): story points from the scale, the estimate in hours,
 * and the time spent, logged here (hours, the day, a short note) and set against the estimate. 읽기만 하면 포인트와
 * 추정시간은 읽는 알약이고, 소요시간은 기록을 볼 수 있게 열린다.
 */
export function WorkItemEffort({ workItem, isDisabled, onChange }: {
  workItem: WorkItemRow; isDisabled: boolean; onChange: (patch: Partial<WorkItemDraft>) => void;
}) {
  const estimate = workItem.estimateHours ?? undefined;
  const spent = workItem.spentHours ?? 0;
  const points = workItem.storyPoints == null ? undefined : String(workItem.storyPoints);
  const estimateText = estimate === undefined ? undefined : `추정 ${formatHours(estimate)}`;
  return <>
    {isDisabled
      ? <InfoPill label="스토리 포인트" icon={<ChartNoAxesColumnIcon />}>{points === undefined ? '포인트 없음' : `${points}점`}</InfoPill>
      : <OptionPill label="스토리 포인트" icon={ChartNoAxesColumnIcon} emptyText="포인트 없음" value={points}
        options={[...STORY_POINTS.map(each => ({ value: String(each), label: `${each}점`, icon: <ChartNoAxesColumnIcon /> })), { value: '', label: '비우기' }]}
        onChange={value => onChange({ storyPoints: value ? Number(value) : undefined })} />}
    {isDisabled
      ? <InfoPill label="추정시간" icon={<ClockIcon />}>{estimateText ?? '추정시간'}</InfoPill>
      : <PropertyPill label="추정시간" icon={<ClockIcon />} text={estimateText}>
        {close => <WorkItemEstimateForm value={estimate} onSave={hours => { onChange({ estimateHours: hours }); close(); }} />}
      </PropertyPill>}
    {spent === 0 && isDisabled
      ? <InfoPill label="소요시간" icon={<ClockIcon />}>소요시간</InfoPill>
      : <PropertyPill label="소요시간" icon={<ClockIcon />} width="w-80"
        text={estimate === undefined ? `소요 ${formatHours(spent)}` : `소요 ${formatHours(spent)} / ${formatHours(estimate)}`}>
        {() => <WorkItemTimeLog workItem={workItem} canLog={!isDisabled} />}
      </PropertyPill>}
  </>;
}
