import { useState } from 'react';
import { SegmentedControl } from '@/shared/ui/kit/segmented-control';
import { SettingsSection } from '@/shared/ui/kit/settings';
import { USER_INSTRUCTIONS } from '../model/agent-instructions';
import { CodeBlock } from './CodeBlock';

const AGENTS = [{ value: 'codex', label: 'Codex' }, { value: 'claude', label: 'Claude Code' }] as const;
type Agent = (typeof AGENTS)[number]['value'];

/** Instructions remain available after the one-time token dialog has closed. */
export function AgentUsageSection() {
  const [agent, setAgent] = useState<Agent>('codex');
  const path = agent === 'codex' ? '~/.codex/AGENTS.md' : '~/.claude/CLAUDE.md';
  const instructions = USER_INSTRUCTIONS.replaceAll('{{INSTANCE_URL}}', window.location.origin);
  return <>
    <SettingsSection title="사용 지침">
      <div className="flex min-w-0 flex-col items-start gap-4 p-4">
        <SegmentedControl label="사용할 에이전트" options={[...AGENTS]} value={agent} onChange={setAgent} />
        <p>아래 지침을 {path}의 기존 내용 아래에 추가하세요. 토큰을 다시 발급할 필요는 없습니다.</p>
        <div className="w-full min-w-0"><CodeBlock title="사용자 공통 지침" code={instructions} isTall /></div>
      </div>
    </SettingsSection>
    <SettingsSection title="프로젝트 연결">
      <div className="flex min-w-0 flex-col gap-4 p-4">
        <p>프로젝트의 이슈·문서를 코드 저장소와 연결하려면 해당 저장소에서 아래 요청을 전달하세요. 플러그인은 사용자 범위에 설치한 그대로 사용합니다.</p>
        <CodeBlock title="에이전트에게 전달할 요청"
          code="cowork 플러그인의 setup-project 스킬로 이 저장소를 연결해 주세요. 기존 AGENTS.md와 팀 기록 정책, Git 변경을 보존하고 사용할 프로젝트를 확인해 주세요." />
      </div>
    </SettingsSection>
  </>;
}
