import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { DisplayPage } from './ui/DisplayPage';

/** /account/display: 화면 설정. */
export const Route = createFileRoute('/_app/account/display/')({
  component: function DisplayRoute() { return <DisplayPage crumbs={useCrumbs()} />; },
});
