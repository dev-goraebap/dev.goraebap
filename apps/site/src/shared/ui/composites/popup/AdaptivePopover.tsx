import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Popover } from '@astryxdesign/core/Popover';
import { cloneElement, useState, type ReactElement, type ReactNode } from 'react';
import { useIsPhone } from '../../foundations/media';
import { SheetBody } from './SheetBody';

/**
 * 버튼 곁에 여는 내용: 데스크톱은 팝오버, 휴대폰은 언제나 바텀시트다(휴대폰에 팝오버를 두지 않는다). content는 고른 뒤
 * 닫을 수 있도록 close를 받는다. trigger는 버튼을 그리는 요소이며 휴대폰에서는 클릭으로 시트를 연다.
 */
export function AdaptivePopover({ label, trigger, content, width = '15rem', placement = 'below', alignment = 'start', sheetHeight = 'hug', isOpen: openProp, defaultOpen = false, onOpenChange }: {
  label: string; trigger: ReactElement<{ onClick?: () => void }>; content: (close: () => void) => ReactNode;
  width?: number | string; placement?: 'above' | 'below' | 'start' | 'end'; alignment?: 'start' | 'center' | 'end';
  /** 시트 높이: hug는 짧은 내용, tall은 검색(키보드)이나 긴 목록. */
  sheetHeight?: 'hug' | 'tall';
  /** 열고 닫힘을 알린다. 열린 동안 눌린 모양을 보이는 트리거에 쓴다. */
  onOpenChange?: (isOpen: boolean) => void;
  /** 바깥에서 열림을 정한다(주소의 ?event= 처럼). 주면 onOpenChange로 바뀜을 받아 되돌려 준다. */
  isOpen?: boolean;
  /** 처음 그릴 때 열어 둔다(바깥에서 정하지 않을 때). */
  defaultOpen?: boolean;
}) {
  const isPhone = useIsPhone();
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = openProp ?? ownOpen;
  const setOpen = (next: boolean) => { setOwnOpen(next); onOpenChange?.(next); };
  const close = () => setOpen(false);
  if (isPhone) return (
    <>
      {cloneElement(trigger, { onClick: () => setOpen(true) })}
      <BottomSheet
        isOpen={isOpen}
        onOpenChange={setOpen}
        label={label}
        height={sheetHeight}
        padding={0}>
        <SheetBody>{content(close)}</SheetBody>
      </BottomSheet>
    </>
  );
  return <Popover isOpen={isOpen} onOpenChange={setOpen} label={label} width={width} placement={placement} alignment={alignment}
    content={content(close)}>
    {trigger}
  </Popover>;
}
