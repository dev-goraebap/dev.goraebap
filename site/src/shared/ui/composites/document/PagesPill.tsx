import { icon } from '../../foundations/icons/solar-icon';
import { ActionMenu } from '../popup/ActionMenu';
import { PropertyPill } from '../property/PropertyPill';
import type { PageLayout } from './pagination';

/**
 * 상세 오른쪽 속성 칸의 페이지 항목: "N페이지", 누르면 페이지 목록(번호와 그 페이지의 대표 제목, 새 제목 없이 이어지는 페이지는 "이어짐")이
 * 뜨고 고르면 그 페이지로 간다. 문서의 목차처럼 정보 묶음 안에 둔다. 배치 전에는 비어 있다.
 */
export function PagesPill({ layout, onSelect }: { layout: PageLayout | null; onSelect: (number: number) => void }) {
  return <PropertyPill label="페이지" icon={icon('layout-list')} isEmpty={!layout} text={layout ? `${layout.count}페이지` : undefined} width="18rem" sheetHeight="tall"
    content={close => <ActionMenu title="페이지" onDone={close} actions={(layout?.pages ?? []).map(page => ({
      id: String(page.number),
      label: `${page.number}  ${page.heading?.text ?? '제목 없음'}${page.continues ? ' (이어짐)' : ''}`,
      onSelect: () => onSelect(page.number),
    }))} />} />;
}
