import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  columnsOptions, integrationRulesOptions, refreshCode, RULE_EVENTS, setIntegrationRule, type BoardColumn, type CodeRule,
} from '@/entities/work-item';
import { SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';
import { RulePicker } from './RulePicker';

/**
 * 자동 이동 규칙: for each event, the status it moves the work items it names to: the board's own choice (the first
 * status under way, the last under way, the first done), another status, or none. 휴대폰은 이름 아래로 고르기를 내린다(SettingsRow wide).
 */
export function IntegrationRulesSection({ projectKey }: { projectKey: string }) {
  const client = useQueryClient();
  const rules = useQuery(integrationRulesOptions(projectKey));
  const columns = useQuery(columnsOptions(projectKey));
  const change = useMutation({
    mutationFn: (rule: { event: CodeRule['event']; set: boolean; columnId?: string | null }) =>
      setIntegrationRule(projectKey, rule as Parameters<typeof setIntegrationRule>[1]),
    onSettled: () => refreshCode(client),
  });
  if (!rules.data || !columns.data) return null;
  const nameOf = (id?: string | null) => columns.data.find((column: BoardColumn) => column.id === id)?.name;
  return <SettingsSection title="자동 이동 규칙" note={change.error?.message}>
    {RULE_EVENTS.map(event => {
      const rule = rules.data.find(each => each.event === event.value);
      const value = !rule?.set ? 'default' : rule.columnId ?? 'stay';
      const options = [
        { value: 'default', label: `보드 기본값${nameOf(rule?.defaultColumnId) ? ` (${nameOf(rule?.defaultColumnId)})` : ' (옮기지 않음)'}` },
        ...columns.data.map((column: BoardColumn) => ({ value: column.id, label: column.name })),
        { value: 'stay', label: '옮기지 않음' },
      ];
      return <SettingsRow key={event.value} wide label={event.label} description={event.hint}>
        <RulePicker label={event.label} value={value} options={options} isDisabled={change.isPending}
          onChange={next => change.mutate(next === 'default' ? { event: event.value, set: false }
            : { event: event.value, set: true, columnId: next === 'stay' ? null : next })} />
      </SettingsRow>;
    })}
  </SettingsSection>;
}
