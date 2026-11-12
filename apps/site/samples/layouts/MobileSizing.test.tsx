import { test } from 'vitest';
import { page as browserPage } from 'vitest/browser';
import { expect, userEvent, waitFor, within } from '../catalog/testing';
import { runSample } from '../catalog/run-sample';
import pageMeta, { HeaderAndToolbar } from './Page.samples';
import menuMeta, { Menus } from '../composites/Overview.samples';

test('모바일과 중간 폭에서도 도구 여백과 시트 선택 행 크기를 유지한다', () => runSample(pageMeta, {
  ...HeaderAndToolbar,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = canvasElement.querySelector('header')!;
    const toolbar = canvas.getByRole('navigation', { name: '보기' }).parentElement!;
    expect(header.getBoundingClientRect().height).toBeGreaterThanOrEqual(60);
    expect(toolbar.getBoundingClientRect().height).toBeGreaterThanOrEqual(60);
    await browserPage.viewport(820, 844);
    await waitFor(() => expect(toolbar.getBoundingClientRect().height).toBeGreaterThanOrEqual(60));
    await userEvent.click(canvas.getByRole('button', { name: '필터 1개 적용 중' }));
    const sheet = within(await within(document.body).findByRole('dialog', { name: '필터' }));
    expect(sheet.getByRole('button', { name: /담당/ }).getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    const done = sheet.getByRole('button', { name: '완료' });
    expect(done.getBoundingClientRect().width).toBeGreaterThanOrEqual(88);
    await userEvent.click(done);
  },
}, 'phone'));

test('모바일 동작 메뉴는 그림과 행을 함께 키우고 선택 후 닫힌다', () => runSample(menuMeta, {
  ...Menus,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '정렬' }));
    const dialog = await within(document.body).findByRole('dialog', { name: '정렬' });
    const choice = within(dialog).getByRole('button', { name: '제목' });
    const row = choice.closest('li')!;
    expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    expect(row.querySelector('svg')!.getBoundingClientRect().width).toBe(20);
    expect(getComputedStyle(row.querySelector('.astryx-text')!).fontSize).toBe('15px');
    await userEvent.click(choice);
    await waitFor(() => expect(dialog).not.toBeVisible());
  },
}, 'phone'));
