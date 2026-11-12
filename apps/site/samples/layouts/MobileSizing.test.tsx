import { test } from 'vitest';
import { page as browserPage } from 'vitest/browser';
import { expect, userEvent, waitFor, within } from '../catalog/testing';
import { runSample } from '../catalog/run-sample';
import { ActionMenu } from '@/shared/ui/action-menu';
import { ArrowUpDownIcon, CalendarIcon, FileTextIcon } from '@/shared/ui/icon';
import pageMeta, { HeaderAndToolbar } from './Page.samples';

/*
 * 휴대폰 크기 규칙(design-system/references/app-layout.md · composed-components.md · icons.md):
 * 머리 줄 · 툴바 최소 60px, 시트의 선택 줄 48px, 완료 단추 88px 이상, 동작 · 선택 목록은 48px 줄에 15px 글자 · 20px 아이콘.
 * 지금 키트는 앱 바 · 툴바가 52px(Page의 h-13), 필터 시트의 완료가 약 68px(FilterMenu의 px-5), 동작 메뉴 줄이 14px 글자 · 16px 아이콘(ActionMenu의 Button 기본)이라
 * 그 몫은 test.fails로 따로 둔다. 키트를 고치면 "통과해서 실패"하므로 test로 되돌린다.
 */
const bars = (canvasElement: HTMLElement) => ({
  header: canvasElement.querySelector<HTMLElement>('[data-slot=page-app-bar]')!,
  toolbar: canvasElement.querySelector<HTMLElement>('[data-slot=page-toolbar]')!,
});

test('모바일과 중간 폭에서도 시트 선택 행 크기를 유지한다', () => runSample(pageMeta, {
  ...HeaderAndToolbar,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const { toolbar } = bars(canvasElement);
    // 64rem 미만이면 중간 폭(820px)도 휴대폰 배치다.
    await browserPage.viewport(820, 844);
    await waitFor(() => expect(canvasElement.querySelector('[data-slot=page-app-bar]')).not.toBeNull());
    expect(toolbar.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    await userEvent.click(canvas.getByRole('button', { name: '필터, 1개 적용 중' }));
    const sheet = within(await within(document.body).findByRole('dialog', { name: '필터' }));
    await waitFor(() => expect(sheet.getByRole('option', { name: /담당/ }).getBoundingClientRect().height).toBeGreaterThanOrEqual(48));
    await userEvent.click(sheet.getByRole('button', { name: '완료' }));
    await waitFor(() => expect(within(document.body).queryByRole('dialog', { name: '필터' })).not.toBeInTheDocument());
  },
}, 'phone'));

test.fails('모바일 머리 줄과 툴바는 60px 이상이다(키트 수정 대기)', () => runSample(pageMeta, {
  ...HeaderAndToolbar,
  play: async ({ canvasElement }) => {
    const { header, toolbar } = bars(canvasElement);
    expect(header.getBoundingClientRect().height).toBeGreaterThanOrEqual(60);
    expect(toolbar.getBoundingClientRect().height).toBeGreaterThanOrEqual(60);
  },
}, 'phone'));

test.fails('모바일 시트의 완료 단추는 88px 이상이다(키트 수정 대기)', () => runSample(pageMeta, {
  ...HeaderAndToolbar,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '필터, 1개 적용 중' }));
    const sheet = within(await within(document.body).findByRole('dialog', { name: '필터' }));
    expect(sheet.getByRole('button', { name: '완료' }).getBoundingClientRect().width).toBeGreaterThanOrEqual(88);
  },
}, 'phone'));

/** 동작 메뉴 하나만 둔 견본. 다른 묶음의 견본에 기대지 않도록 여기서 그린다. */
const SortMenu = {
  name: '동작 메뉴',
  render: () => <div className="p-4"><ActionMenu label="정렬" actions={[
    { label: '제목', icon: FileTextIcon, onSelect: () => {} },
    { label: '수정일', icon: CalendarIcon, onSelect: () => {} },
    { label: '방향 바꾸기', icon: ArrowUpDownIcon, onSelect: () => {} },
  ]} /></div>,
};

test('모바일 동작 메뉴는 48px 행이고 선택 후 닫힌다', () => runSample(pageMeta, {
  ...SortMenu,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '정렬' }));
    const dialog = await within(document.body).findByRole('dialog', { name: '정렬' });
    const choice = within(dialog).getByRole('button', { name: '제목' });
    await waitFor(() => expect(choice.getBoundingClientRect().height).toBeGreaterThanOrEqual(48));
    await userEvent.click(choice);
    await waitFor(() => expect(within(document.body).queryByRole('dialog', { name: '정렬' })).not.toBeInTheDocument());
  },
}, 'phone'));

test.fails('모바일 동작 메뉴는 15px 글자와 20px 아이콘이다(키트 수정 대기)', () => runSample(pageMeta, {
  ...SortMenu,
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: '정렬' }));
    const dialog = await within(document.body).findByRole('dialog', { name: '정렬' });
    const choice = within(dialog).getByRole('button', { name: '제목' });
    expect(Math.round(choice.querySelector('svg')!.getBoundingClientRect().width)).toBe(20);
    expect(getComputedStyle(choice).fontSize).toBe('15px');
  },
}, 'phone'));
