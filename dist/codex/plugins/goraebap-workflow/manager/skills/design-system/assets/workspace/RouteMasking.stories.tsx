import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { RoutingPattern } from './RoutingPattern';
const meta = { title: '패턴/라우트 마스킹', id: 'patterns-routing', component: RoutingPattern,
  args: { direct: false }, argTypes: { direct: { table: { disable: true } } },
} satisfies Meta<typeof RoutingPattern>;
export default meta;
type Story = StoryObj<typeof meta>;
export const FromList: Story = { name: '목록에서 열기' };
export const Verification: Story = { name: '전환·초안 보존 검증', play: async ({ canvasElement, step }) => {
  const screen = within(canvasElement.ownerDocument.body);
  await step('목록에서 마스킹으로 열기', async () => {
    await userEvent.click(await screen.findByRole('button', { name: '새 항목' }));
    const isPhone = canvasElement.ownerDocument.defaultView!.matchMedia('(width < 64rem)').matches;
    if (!isPhone) await screen.findByRole('dialog', { name: '새 항목' });
    else await screen.findByRole('textbox', { name: '제목' });
    await expect(screen.getByRole('status', { name: '라우팅 상태' })).toHaveTextContent('표시 경로 /items/new');
  });
  await step('입력한 초안을 페이지로 이어가기', async () => {
    await userEvent.type(await screen.findByRole('textbox', { name: '제목' }), '전환 뒤에도 남는 초안');
    const dialog = screen.queryByRole('dialog');
    if (dialog) await userEvent.click(within(dialog).getByRole('button', { name: /크게\s?보기/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('전환 뒤에도 남는 초안');
    await expect(screen.getByRole('status', { name: '라우팅 상태' })).toHaveTextContent('내부 경로 /items/new');
  });
} };
export const Direct: Story = { name: '직접 진입', args: { direct: true } };
export const Mobile: Story = { name: '모바일 전체 화면', args: { direct: true }, globals: { viewport: { value: 'iphone14', isRotated: false } } };
