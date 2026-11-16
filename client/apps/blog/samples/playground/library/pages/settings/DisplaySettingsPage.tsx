import { SegmentedControl } from '@/shared/ui/segmented-control';
import { SettingsPage, SettingsRow, SettingsSection } from '@/shared/ui/settings';
import { SettingsIcon } from '@/shared/ui/icon';
import { useAppearance, type Density } from '../../app/appearance';

/**
 * 화면 설정(키트 SettingsPage): 약 720px 열 안의 묶음별 줄. 고르면 그 자리에서 반영하고 저장 단추가 없다.
 * 앱 배치와 목록 높이는 한 곳에서 정하고 모든 페이지가 따른다. 테마는 시스템(가이드 상단 도구)이 정한다.
 * 둘 중 하나를 고르는 값이라 선택 상자 대신 SegmentedControl을 쓴다(펼치지 않고 지금 값과 다른 값이 함께 보인다).
 */
export function DisplaySettingsPage() {
  const appearance = useAppearance();
  return <SettingsPage crumbs={[{ label: '설정', icon: SettingsIcon }, { label: '화면' }]} title="화면 설정" description="이 예제의 배치와 목록 높이를 정합니다.">
    <SettingsSection title="배치">
      <SettingsRow label="페이지 배치" description="Inset은 바탕 위에 떠 있는 면, Split은 선으로 나눈 면입니다. 휴대폰에서는 쓰지 않습니다." wide>
        <SegmentedControl label="페이지 배치" value={appearance.layout} options={[{ value: 'inset', label: 'Inset' }, { value: 'split', label: 'Split' }]}
          onChange={appearance.setLayout} />
      </SettingsRow>
      <SettingsRow label="목록 높이" description="모든 페이지의 목록과 표에 적용합니다. 메뉴와 대화상자 안의 목록은 그대로입니다." wide>
        <SegmentedControl<Density> label="목록 높이" value={appearance.density} options={[{ value: 'spacious', label: '여유 있게' }, { value: 'compact', label: '촘촘하게' }]}
          onChange={appearance.setDensity} />
      </SettingsRow>
    </SettingsSection>
  </SettingsPage>;
}
