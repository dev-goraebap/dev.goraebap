import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pushKeys, pushPreferencesOptions, savePreferences, type PushTopic } from '@/features/push-device';
import { SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';
import { Switch } from '@goraebap/ui-react/components/switch';
import { topicLabels } from '../model/push-labels';

/**
 * Which groups of notices come as a push, one switch each, saved as it is flipped. They apply to every device of the
 * member's; notices turned off here still arrive in 받은 알림.
 */
export function NotificationTopicsSection() {
  const client = useQueryClient();
  const preferences = useQuery(pushPreferencesOptions());
  const save = useMutation({
    mutationFn: (muted: PushTopic[]) => savePreferences(muted),
    onMutate: muted => client.setQueryData(pushPreferencesOptions().queryKey, previous =>
      previous && { topics: previous.topics.map(item => ({ ...item, enabled: !muted.includes(item.topic) })) }),
    onSettled: () => client.invalidateQueries({ queryKey: [...pushKeys.all, 'preferences'] }),
  });
  const topics = preferences.data?.topics ?? [];
  const toggle = (topic: PushTopic, enabled: boolean) =>
    save.mutate(topics.filter(item => (item.topic === topic ? !enabled : !item.enabled)).map(item => item.topic));
  return (
    <SettingsSection title="받을 알림" note={save.error?.message}>
      {preferences.isError ? <SettingsRow label="받을 알림을 불러오지 못했습니다" description={preferences.error.message} hasValue={false} />
        : !preferences.data ? <SettingsRow label="불러오는 중…" hasValue={false} />
          : topics.map(item => (
            <SettingsRow key={item.topic} label={topicLabels[item.topic].label} description={topicLabels[item.topic].description}>
              <Switch appearance="compact" aria-label={topicLabels[item.topic].label} checked={item.enabled} onCheckedChange={enabled => toggle(item.topic, enabled)} />
            </SettingsRow>
          ))}
    </SettingsSection>
  );
}
