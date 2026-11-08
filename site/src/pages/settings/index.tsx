import { pluginVersion, siteVersion } from '@/shared/config/site';
import { Selector } from '@astryxdesign/core/Selector';
import { useRouterState } from '@tanstack/react-router';
import { usePreferences } from '@/entities/preferences';
import { SettingsSection, SettingsField } from '@/shared/ui/layouts/settings/Settings';
import { RouterLink } from '@/shared/ui/patterns/routing/RouterLink';
import styles from './settings.module.css';
export function SettingsPage() {
  const { mode, setMode, layout, setLayout } = usePreferences();
  const plugins = useRouterState({ select: s => s.location.pathname.includes('/plugins') });
  return <div className={styles.page}><h1>{plugins ? '플러그인' : '화면'}</h1>{plugins ? <>
    <SettingsSection title="Webcraft"><SettingsField label="설치 이름" isValue><code>webcraft@dev-goraebap</code></SettingsField><SettingsField label="버전" isValue>{pluginVersion}</SettingsField></SettingsSection>
    <SettingsSection title="에이전트 연결"><SettingsField label="Codex"><pre>codex plugin marketplace add https://github.com/dev-goraebap/dev.goraebap.git --ref main{'\n'}codex plugin add webcraft@dev-goraebap</pre></SettingsField><SettingsField label="Claude Code"><pre>/plugin marketplace add dev-goraebap/dev.goraebap{'\n'}/plugin install webcraft@dev-goraebap</pre></SettingsField></SettingsSection>
    <RouterLink href="/webcraft/rules/manage-workflow/">프로젝트 연결 안내</RouterLink>
  </> : <SettingsSection title="화면 설정"><SettingsField label="테마"><Selector label="테마" isLabelHidden value={mode} options={[{ value: 'light', label: '라이트' }, { value: 'dark', label: '다크' }]} onChange={v => setMode(v as 'light' | 'dark')} /></SettingsField><SettingsField label="레이아웃"><Selector label="레이아웃" isLabelHidden value={layout} options={[{ value: 'inset', label: 'Inset' }, { value: 'split', label: 'Split' }]} onChange={v => setLayout(v as 'inset' | 'split')} /></SettingsField></SettingsSection>}<small className={styles.version}>v{siteVersion}</small></div>;
}
