import { Link, useRouterState } from '@tanstack/react-router';
import { usePreferences } from '@/entities/preferences';
import { paths } from '@/shared/config/paths';
import { pluginVersion } from '@/shared/config/site';
import { SegmentedControl } from '@/shared/ui/segmented-control';
import { SettingsBody, SettingsRow, SettingsSection } from '@/shared/ui/settings';
import { AgentInstructions } from './AgentInstructions';

const modes = [{ value: 'light' as const, label: '라이트' }, { value: 'dark' as const, label: '다크' }];
const layouts = [{ value: 'inset' as const, label: 'Inset' }, { value: 'split' as const, label: 'Split' }];

/** 설치 명령: 줄바꿈을 지키고, 좁으면 줄 안에서 접는다. */
function Commands({ children }: { children: string }) {
  return <pre className="max-w-full overflow-x-auto font-mono text-[0.8125rem] leading-[1.7] wrap-anywhere whitespace-pre-wrap">{children}</pre>;
}

/**
 * 설정(/settings/appearance/ · /settings/plugins/). 페이지 틀(경로 머리 줄)은 셸이 그리고, 여기서는 가운데 한 열의 본문만 그린다.
 * 화면: 모드와 셸 배치. 이 브라우저에만 남는다(entities/preferences). 플러그인: Webcraft 설치 이름 · 버전과 설치 방법.
 */
export function SettingsPage() {
  const { mode, setMode, layout, setLayout } = usePreferences();
  const isPlugins = useRouterState({ select: state => state.location.pathname.includes('/plugins') });
  if (isPlugins) {
    return <SettingsBody title="플러그인" description="Webcraft 개발 지침 플러그인을 에이전트에 설치합니다.">
      <SettingsSection title="Webcraft">
        <SettingsRow label="설치 이름"><code className="font-mono text-sm">webcraft@dev-goraebap</code></SettingsRow>
        <SettingsRow label="버전"><span className="tabular-nums">{pluginVersion}</span></SettingsRow>
      </SettingsSection>
      <AgentInstructions />
      <SettingsSection title="사용자 범위 설치" note={<>프로젝트에 연결하는 방법은 <Link to={paths.projectLink} className="text-foreground underline underline-offset-4">프로젝트 연결 안내</Link>를 봅니다.</>}>
        <SettingsRow wide label="Codex"><Commands>{'codex plugin marketplace add https://github.com/dev-goraebap/dev.goraebap.git --ref main\ncodex plugin add webcraft@dev-goraebap'}</Commands></SettingsRow>
        <SettingsRow wide label="Claude Code"><Commands>{'/plugin marketplace add dev-goraebap/dev.goraebap\n/plugin install webcraft@dev-goraebap --scope user'}</Commands></SettingsRow>
      </SettingsSection>
    </SettingsBody>;
  }
  return <SettingsBody title="화면" description="가이드의 색과 셸 배치를 정합니다.">
    <SettingsSection title="화면 설정" note="이 브라우저에만 저장됩니다. 견본 화면도 같은 모드와 배치를 따릅니다.">
      <SettingsRow wide label="테마" description="라이트와 다크 중에서 고릅니다.">
        <SegmentedControl label="테마" options={modes} value={mode} onChange={setMode} />
      </SettingsRow>
      <SettingsRow wide label="레이아웃" description="Inset은 바닥 위에 떠 있는 둥근 본문 면, Split은 가는 선으로 나눈 평평한 면입니다.">
        <SegmentedControl label="레이아웃" options={layouts} value={layout} onChange={setLayout} />
      </SettingsRow>
    </SettingsSection>
  </SettingsBody>;
}
