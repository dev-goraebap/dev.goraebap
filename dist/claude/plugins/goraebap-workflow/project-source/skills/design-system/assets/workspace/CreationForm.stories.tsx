import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreationPattern } from './CreationPattern';
const meta = { title: '사용 패턴/생성 양식', id: 'patterns-creation', component: CreationPattern,
  args: { surface: 'dialog' }, argTypes: { surface: { name: '표현', control: 'inline-radio', options: ['dialog', 'page'] } },
} satisfies Meta<typeof CreationPattern>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Dialog: Story = { name: '다이얼로그', args: { initialOpen: false } };
export const Page: Story = { name: '페이지', args: { surface: 'page' } };
export const Mobile: Story = { name: '모바일', globals: { viewport: { value: 'iphone14', isRotated: false } } };
export const Stepped: Story = { name: '단계형 양식', args: { stepped: true } };
