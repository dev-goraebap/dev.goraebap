import { Button } from '@astryxdesign/core/Button';
import { useState } from 'react';
import { pluginVersion } from '@/shared/config/site';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { SettingsSection } from '@/shared/ui/layouts/settings/Settings';
import styles from './settings.module.css';

export const agentInstructions = `이 프로젝트의 개발 지침을 Webcraft(webcraft@dev-goraebap, ${pluginVersion} 이상)에 연결해 주세요.

원본 마켓플레이스: https://github.com/dev-goraebap/dev.goraebap.git

1. 현재 프로젝트의 AGENTS.md와 Git 변경·스테이징 상태를 먼저 확인하고 기존 작업을 보존해 주세요.
2. 현재 에이전트 환경에서 Webcraft 설치와 버전을 확인해 주세요. 설치되지 않았다면 위 마켓플레이스의 webcraft@dev-goraebap을 설치해 주세요.
3. 설치된 Webcraft의 manage-workflow를 읽고 프로젝트 연결 절차를 수행해 주세요. 기존 지침 사본·동기화 구성이 있다면 사본 전환 절차로 비교하고, 프로젝트에서 바꾼 규칙과 제품 전용 스킬을 보존해 주세요. 삭제할 대상은 먼저 정리해 사용자에게 확인해 주세요.
4. AGENTS.md에 Webcraft를 따른다는 개발 지침과 최소 판을 명시해 주세요. 작업은 webcraft-mode에서 시작하고, 변경 영역의 지침을 함께 읽도록 연결해 주세요. 프로젝트 고유 예외는 프로젝트 규칙에만 남겨 주세요.
5. 지침 사본을 새로 만들거나 사이트·실행 견본을 프로젝트에 자동 복사하지 마세요. 회사 정보와 접속 정보는 공통 원본이나 제안서로 보내지 마세요.
6. 변경한 파일, 보존·이관한 규칙, 실제 검증과 미확인 범위를 보고해 주세요. 커밋·푸시·배포는 별도 요청이 있을 때만 수행해 주세요.`;

export function AgentInstructions() {
  const [message, setMessage] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(agentInstructions); setMessage('복사했습니다.'); }
    catch { setMessage('복사하지 못했습니다. 아래 텍스트를 선택해 복사해 주세요.'); }
  };
  return <SettingsSection title="에이전트 전달용 지침" action={<Button label="지침 복사" size="sm" variant="subtle" icon={icon('copy')} onClick={copy} />}>
    <div className={styles.instructions}><pre tabIndex={0} aria-label="에이전트 전달용 지침">{agentInstructions}</pre>{message ? <p role="status">{message}</p> : null}</div>
  </SettingsSection>;
}
