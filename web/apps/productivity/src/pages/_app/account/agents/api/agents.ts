import { queryOptions } from '@tanstack/react-query';
import { getJson, sendCommand, sendJson, type components } from '@/shared/api';

export type AgentToken = components['schemas']['AgentTokenView'];
export type AgentProfile = Required<components['schemas']['AgentProfileView']>;
export type AgentTokenCreated = { token: AgentToken; secret: string };


export const agentTokenKeys = { all: ['me', 'agent-tokens'] as const };

/** The member's agent tokens, working or expired, newest first. */
export const agentTokensOptions = () => queryOptions({
  queryKey: agentTokenKeys.all,
  queryFn: ({ signal }) => getJson<AgentToken[]>('/api/v1/me/agent-tokens', signal),
});

/** Makes a token; the answer holds the token itself, the only time the server gives it. */
export const createAgentToken = (body: components['schemas']['AgentTokenCreate']) =>
  sendJson<AgentTokenCreated>('/api/v1/me/agent-tokens', 'POST', body);

export const revokeAgentToken = (id: string) => sendCommand(`/api/v1/me/agent-tokens/${id}`, 'DELETE');

export const agentProfilesOptions = () => queryOptions({
  queryKey: [...agentTokenKeys.all, 'profiles'], queryFn: ({signal}) => getJson<AgentProfile[]>('/api/v1/me/agents', signal),
});
export const editAgentProfile = (profile: AgentProfile, input: { name: string; icon: string; color: string }) =>
  sendCommand(`/api/v1/me/agents/${profile.id}`, 'PATCH', { ...input, expectedVersion: profile.version });

