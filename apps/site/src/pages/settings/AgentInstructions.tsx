import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { CopyIcon } from '@/shared/ui/icon';
import { SettingsSection } from '@/shared/ui/settings';

export const agentInstructions = `Webcraft 플러그인(webcraft@dev-goraebap)을 현재 에이전트의 사용자 범위에 설치해 주세요.

마켓플레이스: https://github.com/dev-goraebap/dev.goraebap.git

현재 환경(Codex 또는 Claude Code)에 맞는 플러그인 설치 기능을 사용하고, 설치된 버전과 활성 상태를 확인해 주세요.

프로젝트 온보딩은 설치 후 Webcraft의 manage-workflow로 별도 진행합니다. 이번 설치 작업에서 프로젝트의 AGENTS.md나 지침 사본을 변경하지 마세요.`;

/**
 * 에이전트에게 그대로 건넬 설치 지침. 복사 결과는 단추 아래 한 줄로 알린다(복사하지 못하면 글을 직접 고르도록 안내).
 * 글은 스크롤 상자(최대 20rem)에 두고 키보드로도 스크롤하도록 초점을 받는다.
 */
export function AgentInstructions() {
  const [message, setMessage] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(agentInstructions); setMessage('복사했습니다.'); }
    catch { setMessage('복사하지 못했습니다. 아래 텍스트를 선택해 복사해 주세요.'); }
  };
  return <SettingsSection title="에이전트 전달용 설치 지침" note="프로젝트 온보딩은 설치 후 Webcraft의 manage-workflow로 진행합니다."
    action={<Button variant="secondary" size="sm" onClick={copy}><CopyIcon data-icon="inline-start" />지침 복사</Button>}>
    <div className="flex flex-col gap-2 p-4">
      <pre tabIndex={0} aria-label="에이전트 전달용 지침"
        className="m-0 max-h-80 overflow-y-auto rounded-md font-mono text-[0.8125rem] leading-[1.7] wrap-anywhere whitespace-pre-wrap outline-none [scrollbar-gutter:stable] focus-visible:ring-2 focus-visible:ring-ring">{agentInstructions}</pre>
      {message ? <p role="status" className="text-[0.8125rem] text-muted-foreground">{message}</p> : null}
    </div>
  </SettingsSection>;
}
