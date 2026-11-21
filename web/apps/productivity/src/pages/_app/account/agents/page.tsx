import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { agentProfilesOptions, agentTokensOptions } from './api/agents';
import { AgentTokensPage } from './ui/AgentTokensPage';

/** /account/agents: 내 AI 에이전트(토큰 · 연결 방법). */
export const Route = createFileRoute('/_app/account/agents/')({
  loader: ({ context }) => Promise.all([
    context.queryClient.query(agentProfilesOptions()).catch(() => undefined),
    context.queryClient.query(agentTokensOptions()).catch(() => undefined),
  ]),
  component: function AgentsRoute() { return <AgentTokensPage crumbs={useCrumbs()} />; },
});
