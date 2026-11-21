import { createFileRoute } from '@tanstack/react-router';
import { prepare } from '@/shared/lib/prepare';
import { columnsOptions, integrationRulesOptions, integrationsOptions } from '@/entities/work-item';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { ProjectIntegrationsPage } from './ui/ProjectIntegrationsPage';

/** /workspace/projects/{key}/settings/integrations: 저장소 연동과 그 규칙. */
export const Route = createFileRoute('/_app/workspace/projects/$key/settings/integrations/')({
  loader: ({ context, location, params }) => prepare(context.queryClient, location.href, ({ prime }) => Promise.all([prime(integrationsOptions(params.key)), prime(integrationRulesOptions(params.key)), prime(columnsOptions(params.key))])),
  component: function ProjectIntegrationsPageRoute() {
    const { key } = Route.useParams();
    return <ProjectIntegrationsPage crumbs={useCrumbs()} projectKey={key} />;
  },
});
