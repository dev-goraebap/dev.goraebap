import { Button } from '@astryxdesign/core/Button';
import { useState } from 'react';
import { icon } from '../../foundations/icons/solar-icon';
import { ActionMenu, type MenuAction } from './ActionMenu';
import { AdaptivePopover } from './AdaptivePopover';

/**
 * 행이나 페이지 끝의 …: 그 대상의 수정·삭제 같은 동작. 열린 동안 Bold Duotone. 행 메뉴는 그 항목, 페이지 메뉴는 페이지
 * 자체의 동작에만 쓴다.
 */
export function RowMenu({ label, actions }: { label: string; actions: MenuAction[] }) {
  const [isOpen, setOpen] = useState(false);
  return <AdaptivePopover label={label} alignment="end" onOpenChange={setOpen}
    trigger={<Button label={label} tooltip={label} variant="ghost" size="sm" isIconOnly icon={icon('more', isOpen)} />}
    content={close => <ActionMenu onDone={close} actions={actions} />} />;
}
