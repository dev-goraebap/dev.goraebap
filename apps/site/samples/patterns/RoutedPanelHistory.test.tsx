import { render } from '@testing-library/react';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from '@tanstack/react-router';
import { page } from 'vitest/browser';
import { test } from 'vitest';
import { expect, userEvent, waitFor, within } from '../catalog/testing';
import { useOpenPanel, useRoutedPanel } from '../../src/shared/ui/patterns/routing/routed-panel';

function Rows() {
  const open = useOpenPanel();
  const panel = useRoutedPanel();
  return <>
    <button onClick={() => open('/editor/first')}>열기</button>
    {panel.href ? <section role="dialog" aria-label="내용">
      <span>{panel.href}</span>
      <button onClick={() => open('/editor/second')}>다음 내용</button>
      <button onClick={panel.close}>닫기</button>
    </section> : null}
  </>;
}

test('내부 이동은 이력을 쌓지 않고 닫기는 원래 목록으로 돌아간다', async () => {
  await page.viewport(1440, 960);
  const root = createRootRoute({ component: Outlet });
  const rows = createRoute({ getParentRoute: () => root, path: '/rows', component: Rows });
  const editor = createRoute({ getParentRoute: () => root, path: '/editor/$id', component: () => null });
  const history = createMemoryHistory({ initialEntries: ['/rows?filter=kept'] });
  const router = createRouter({ routeTree: root.addChildren([rows, editor]), history, unmaskOnReload: true });
  await router.load();
  const view = render(<RouterProvider router={router} />);
  const screen = within(view.container);
  await userEvent.click(await screen.findByRole('button', { name: '열기' }));
  await screen.findByText('/editor/first');
  expect(history.length).toBe(2);
  await userEvent.click(screen.getByRole('button', { name: '다음 내용' }));
  await screen.findByText('/editor/second');
  expect(history.length).toBe(2);
  await userEvent.click(screen.getByRole('button', { name: '닫기' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(router.state.location.pathname).toBe('/rows');
  expect((router.state.location.search as Record<string, unknown>).filter).toBe('kept');
});
