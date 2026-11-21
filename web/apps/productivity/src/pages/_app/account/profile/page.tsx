import { createFileRoute } from '@tanstack/react-router';
import { useCrumbs } from '@/shared/lib/page-crumbs';
import { ProfilePage } from './ui/ProfilePage';

/** /account/profile: 내 정보(이름 · 사진 · 이메일). */
export const Route = createFileRoute('/_app/account/profile/')({
  component: function ProfileRoute() { return <ProfilePage crumbs={useCrumbs()} />; },
});
