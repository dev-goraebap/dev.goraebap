import type { CodeLink } from '@/entities/work-item';

/** PR에 포함된 브랜치는 같은 연결 안에서만 숨긴다. */
export function visibleCodeLinks(links: readonly CodeLink[]): CodeLink[] {
  const requested = new Set(links.filter(link => link.kind === 'pull_request').map(link => `${link.integrationId}:${link.detail}`));
  return links.filter(link => !(link.kind === 'branch' && requested.has(`${link.integrationId}:${link.externalId}`)));
}
