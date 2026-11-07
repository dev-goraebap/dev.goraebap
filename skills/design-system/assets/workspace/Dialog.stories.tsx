import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { DialogPattern } from './DialogPattern';
const meta = { title: '패턴/공통 다이얼로그', id: 'patterns-dialog', component: DialogPattern,
  args: { long: false, divider: false, initialOpen: false },
  argTypes: { long: { name: '긴 본문', control: 'boolean' }, divider: { name: '푸터 구분선', control: 'boolean' } },
} satisfies Meta<typeof DialogPattern>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Basic: Story = { name: '기본' };
export const LongBody: Story = { name: '긴 본문', args: { long: true, initialOpen: true } };
export const FooterDivider: Story = { name: '푸터 구분선', args: { divider: true, initialOpen: true } };
export const Keyboard: Story = { name: '닫기와 초점 복귀', play: async ({ canvasElement, step }) => {
  const screen = within(canvasElement.ownerDocument.body);
  await step('닫고 다시 열기', async () => {
    await userEvent.click(screen.getByRole('button', { name: '다이얼로그 열기' }));
    const dialog = await screen.findByRole('dialog', { name: '알림 설정' });
    await waitFor(() => expect(dialog.getAnimations({ subtree: true }).some(animation => animation.playState === 'running')).toBe(false));
    await userEvent.click(within(dialog).getByRole('button', { name: '닫기' }));
    await waitFor(() => expect(screen.queryByRole('dialog'), '다이얼로그를 닫고 DOM에서 제거한다').not.toBeInTheDocument());
    const trigger = screen.getByRole('button', { name: '다이얼로그 열기' });
    await userEvent.click(trigger);
    const reopened = await screen.findByRole('dialog', { name: '알림 설정' });
    await waitFor(() => expect(reopened.getAnimations({ subtree: true }).some(animation => animation.playState === 'running')).toBe(false));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog'), 'Esc로 다이얼로그를 닫는다').not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
} };
