import { Selector } from '@astryxdesign/core/Selector';
import { SettingsField, SettingsPage, SettingsSection } from '@kit/layouts/settings/Settings';
import { useAppearance } from '../../app/appearance';

/** 화면 설정: 앱 배치와 목록 밀도는 한 곳에서 정하고 모든 페이지가 따른다. 테마는 시스템(카탈로그 상단 도구)이 정한다. */
export function DisplaySettingsPage() {
  const appearance = useAppearance();
  return <SettingsPage crumbs={[{ label: '설정', icon: 'settings' }, { label: '화면' }]} title="화면 설정">
    <SettingsSection title="배치">
      <SettingsField label="페이지 배치" description="Inset은 바탕 위에 떠 있는 면, Split은 선으로 나눈 면입니다. 휴대폰에서는 쓰지 않습니다.">
        <Selector label="페이지 배치" isLabelHidden value={appearance.layout} options={[{ value: 'inset', label: 'Inset' }, { value: 'split', label: 'Split' }]}
          onChange={value => appearance.setLayout(value as 'inset' | 'split')} />
      </SettingsField>
      <SettingsField label="목록 높이" description="모든 페이지의 목록과 표에 적용합니다. 메뉴와 대화상자 안의 목록은 그대로입니다.">
        <Selector label="목록 높이" isLabelHidden value={appearance.density} options={[{ value: 'comfortable', label: '여유 있게' }, { value: 'compact', label: '촘촘하게' }]}
          onChange={value => appearance.setDensity(value as 'comfortable' | 'compact')} />
      </SettingsField>
    </SettingsSection>
  </SettingsPage>;
}
