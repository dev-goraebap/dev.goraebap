import { Button } from '@astryxdesign/core/Button';
import { useState } from 'react';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { SettingsSection } from '@/shared/ui/layouts/settings/Settings';
import styles from './settings.module.css';

export const agentInstructions = `Webcraft 플러그인(webcraft@dev-goraebap)을 현재 에이전트의 사용자 범위에 설치해 주세요.

마켓플레이스: https://github.com/dev-goraebap/dev.goraebap.git

현재 환경(Codex 또는 Claude Code)에 맞는 플러그인 설치 기능을 사용하고, 설치된 버전과 활성 상태를 확인해 주세요.

프로젝트 온보딩은 설치 후 Webcraft의 manage-workflow로 별도 진행합니다. 이번 설치 작업에서 프로젝트의 AGENTS.md나 지침 사본을 변경하지 마세요.`;

export function AgentInstructions() {
  const [message, setMessage] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(agentInstructions); setMessage('복사했습니다.'); }
    catch { setMessage('복사하지 못했습니다. 아래 텍스트를 선택해 복사해 주세요.'); }
  };
  return <SettingsSection title="에이전트 전달용 설치 지침" note="프로젝트 온보딩은 설치 후 Webcraft의 manage-workflow로 진행합니다." action={<Button label="지침 복사" size="sm" variant="subtle" icon={icon('copy')} onClick={copy} />}>
    <div className={styles.instructions}><pre tabIndex={0} aria-label="에이전트 전달용 지침">{agentInstructions}</pre>{message ? <p role="status">{message}</p> : null}</div>
  </SettingsSection>;
}
