import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutPattern } from './LayoutPattern';
const meta = { title: '레이아웃/Split·Inset', id: 'patterns-layout', component: LayoutPattern,
  args: { layout: 'inset', long: false },
  argTypes: { layout: { name: '레이아웃', control: 'inline-radio', options: ['split', 'inset'] }, long: { name: '긴 목록', control: 'boolean' } },
} satisfies Meta<typeof LayoutPattern>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Inset: Story = { name: 'Inset' };
export const Split: Story = { name: 'Split', args: { layout: 'split' } };
export const LongList: Story = { name: '긴 목록', args: { long: true } };
export const Mobile: Story = { name: '모바일', globals: { viewport: { value: 'iphone14', isRotated: false } } };
