import { LinkProvider } from '@astryxdesign/core/Link';
import { RouterLink } from '@kit/patterns/routing/RouterLink';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useNavigate } from '@tanstack/react-router';
import { createContext, useContext, useEffect, useState } from 'react';
import { AuthApiContext, type AuthApi } from '../entities/auth';
import { createAuthApi } from '../mocks/auth-api';
import { SignedInPage } from '../pages/done/SignedInPage';
import { ForgotPage } from '../pages/forgot/ForgotPage';
import { LoginPage } from '../pages/login/LoginPage';

/** 로그인한 계정 이름. 주소에 싣지 않고 앱이 들고 있는다. */
const SessionContext = createContext<{ name: string; setName: (name: string) => void }>({ name: '', setName: () => {} });

/** 모르는 주소는 로그인으로 보낸다. */
function ToLogin() {
  const navigate = useNavigate();
  useEffect(() => { void navigate({ href: '/login', replace: true }); }, [navigate]);
  return null;
}

type Seed = { initialEmail?: string; hasInitialFailure?: boolean };

export function createLoginRouter(initialPath: string, seed: Seed) {
  const root = createRootRoute({
    component: () => <LinkProvider component={RouterLink}><Outlet /></LinkProvider>,
    notFoundComponent: () => <ToLogin />,
  });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: () => <ToLogin /> });
  const login = createRoute({ getParentRoute: () => root, path: '/login', component: function LoginRoute() {
    const navigate = useNavigate();
    const session = useContext(SessionContext);
    return <LoginPage {...seed} onSignedIn={name => { session.setName(name); void navigate({ href: '/done', replace: true }); }} />;
  } });
  const forgot = createRoute({ getParentRoute: () => root, path: '/forgot', component: function ForgotRoute() {
    const navigate = useNavigate();
    return <ForgotPage onBack={() => void navigate({ href: '/login' })} />;
  } });
  const done = createRoute({
    getParentRoute: () => root, path: '/done',
    component: function DoneRoute() {
      const { name } = useContext(SessionContext);
      const navigate = useNavigate();
      return <SignedInPage name={name} onSignOut={() => void navigate({ href: '/login', replace: true })} />;
    },
  });
  return createRouter({
    routeTree: root.addChildren([home, login, forgot, done]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

/** 셸 없는 로그인 앱. 견본마다 메모리 라우터와 모의 인증을 새로 만든다. */
export function LoginApp({ api, initialPath = '/login', initialEmail, hasInitialFailure }: {
  api?: AuthApi; initialPath?: string; initialEmail?: string; hasInitialFailure?: boolean;
}) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { mutations: { retry: false } } }));
  const [repository] = useState(() => api ?? createAuthApi({ delay: 600 }));
  const [router] = useState(() => createLoginRouter(initialPath, { initialEmail, hasInitialFailure }));
  const [name, setName] = useState('');
  return <QueryClientProvider client={client}>
    <AuthApiContext value={repository}><SessionContext value={{ name, setName }}><RouterProvider router={router} /></SessionContext></AuthApiContext>
  </QueryClientProvider>;
}
