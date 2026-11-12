import { Button } from '@astryxdesign/core/Button';
import { useToast } from '@astryxdesign/core/Toast';
import { VStack } from '@astryxdesign/core/VStack';
import { icon } from '../../foundations/icons/solar-icon';
import { ActionMenu } from '../popup/ActionMenu';
import { AdaptivePopover } from '../popup/AdaptivePopover';
import styles from './document.module.css';

/**
 * 내보내기: 내려받기 아이콘과 묶음 메뉴. 내보내기 묶음은 PDF로 저장과 인쇄, 공유 묶음은 링크 복사다. 동작은 호스트가 바꿀 수 있다:
 * 서버에서 PDF를 만드는 앱은 onSavePdf를 준다. 주지 않으면 둘 다 브라우저 인쇄 창을 연다(문서만 찍고 페이지 설정의 용지·여백·머리말·
 * 바닥글을 쓴다). link를 주지 않으면 지금 주소를 복사한다. DOCX는 아직 다루지 않는다.
 */
export function ExportMenu({ onSavePdf = () => window.print(), onPrint = () => window.print(), link }: {
  onSavePdf?: () => void; onPrint?: () => void; link?: string;
}) {
  const toast = useToast();
  const copy = async () => {
    try { await navigator.clipboard.writeText(link ?? location.href); toast({ body: '링크를 복사했습니다' }); }
    catch { toast({ body: '링크를 복사하지 못했습니다' }); }
  };
  return <AdaptivePopover label="내보내기" width="15rem" alignment="end"
    trigger={<Button label="내보내기" variant="ghost" size="sm" icon={icon('download')} endContent={icon('chevron-down')}>{''}</Button>}
    content={close => <VStack className={styles.exportMenu} gap={1}>
      <ActionMenu title="내보내기" onDone={close} actions={[
        { id: 'pdf', label: 'PDF로 저장', icon: 'document', onSelect: onSavePdf },
        { id: 'print', label: '인쇄', icon: 'clipboard', onSelect: onPrint },
      ]} />
      <ActionMenu title="공유" onDone={close} actions={[{ id: 'link', label: '링크 복사', icon: 'link', onSelect: () => void copy() }]} />
    </VStack>} />;
}
