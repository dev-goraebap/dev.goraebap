import { COLOR_THEMES, DIAGRAM_STYLES, setAppearance, useAppearance, type ColorTheme, type Density, type DiagramStyle, type Font, type Layout, type Mode, type SerifScope } from '@/shared/lib/appearance';
import { cn } from 'cn';
import { DiagramPreview } from '@/shared/lib/rich-document';
import { SegmentedControl } from '@/shared/ui/kit/segmented-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/kit/select';
import { SettingsPage, SettingsRow, SettingsSection } from '@/shared/ui/kit/settings';
import { pageCrumbs } from '@/shared/ui/nav-icon';

type Crumb = { label: string; href?: string; icon?: string };

const MODES: { value: Mode; label: string }[] = [{ value: 'system', label: '시스템' }, { value: 'light', label: '라이트' }, { value: 'dark', label: '다크' }];
const LAYOUTS: { value: Layout; label: string }[] = [{ value: 'inset', label: '인셋' }, { value: 'split', label: '분할형' }];
const DENSITIES: { value: Density; label: string }[] = [{ value: 'comfortable', label: '넉넉하게' }, { value: 'compact', label: '촘촘하게' }];
const FONTS: { value: Font; label: string }[] = [{ value: 'gothic', label: '기본 고딕' }, { value: 'serif', label: '명조' }];
const SERIF_SCOPES: { value: SerifScope; label: string }[] = [{ value: 'body', label: '본문만' }, { value: 'all', label: '전체' }];
const DIAGRAMS = DIAGRAM_STYLES.map(style => ({ value: style.id, label: style.label }));

/**
 * Each theme's preview, a gradient app/theme/color-tokens.ts puts on html as --cowork-theme-<id>-preview. The classes are
 * written out whole so Tailwind finds them; a theme whose preview is not defined shows the muted ground.
 */
const SWATCH: Record<ColorTheme, string> = {
  stone: '[background:var(--cowork-theme-stone-preview,var(--muted))]',
  apricot: '[background:var(--cowork-theme-apricot-preview,var(--muted))]',
  sprout: '[background:var(--cowork-theme-sprout-preview,var(--muted))]',
  'cotton-candy': '[background:var(--cowork-theme-cotton-candy-preview,var(--muted))]',
  'dawn-mist': '[background:var(--cowork-theme-dawn-mist-preview,var(--muted))]',
  'night-sea': '[background:var(--cowork-theme-night-sea-preview,var(--muted))]',
  campfire: '[background:var(--cowork-theme-campfire-preview,var(--muted))]',
};

/** 화면 설정: the colour theme and mode, a desktop's layout, how tall a page's rows are and the typeface, each applied at once and kept in this browser. */
export function DisplayPage({ crumbs }: { crumbs: Crumb[] }) {
  const { mode, color, layout, density, font, serifScope, diagram } = useAppearance();
  return (
    <SettingsPage crumbs={pageCrumbs(crumbs)} title="화면 설정">
      <SettingsSection title="색상 테마">
        <div role="group" aria-label="색상 테마" className="flex flex-wrap gap-4 p-4">
          {COLOR_THEMES.map(theme => {
            const isChosen = color === theme.id;
            return (
              <button key={theme.id} type="button" aria-pressed={isChosen} onClick={() => setAppearance({ color: theme.id })}
                className="group/swatch flex flex-col items-center gap-2 rounded-lg p-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                <span aria-hidden className={cn('h-12 w-24 rounded-lg border', SWATCH[theme.id],
                  isChosen && 'outline-2 outline-offset-2 outline-ring')} />
                <span className={cn('rounded-full px-2.5 py-0.5', isChosen ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground group-hover/swatch:text-foreground')}>
                  {theme.label}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsSection>
      <SettingsSection title="모양">
        <SettingsRow wide label="모드">
          <SegmentedControl label="모드" options={MODES} value={mode} onChange={value => setAppearance({ mode: value })} />
        </SettingsRow>
        <SettingsRow wide label="레이아웃">
          <SegmentedControl label="레이아웃" options={LAYOUTS} value={layout} onChange={value => setAppearance({ layout: value })} />
        </SettingsRow>
        <SettingsRow wide label="목록 높이">
          <SegmentedControl label="목록 높이" options={DENSITIES} value={density} onChange={value => setAppearance({ density: value })} />
        </SettingsRow>
      </SettingsSection>
      <SettingsSection title="글꼴">
        <SettingsRow wide label="글꼴">
          <SegmentedControl label="글꼴" options={FONTS} value={font} onChange={value => setAppearance({ font: value })} />
        </SettingsRow>
        {font === 'serif' ? (
          <SettingsRow wide label="명조 적용 범위">
            <SegmentedControl label="명조 적용 범위" options={SERIF_SCOPES} value={serifScope} onChange={value => setAppearance({ serifScope: value })} />
          </SettingsRow>
        ) : null}
      </SettingsSection>
      <SettingsSection title="도표">
        <SettingsRow wide label="도표 그림체">
          <Select items={DIAGRAMS} value={diagram} onValueChange={next => { if (next != null) setAppearance({ diagram: next as DiagramStyle }); }}>
            <SelectTrigger aria-label="도표 그림체" className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DIAGRAMS.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingsRow>
        <div className="rounded-xl border bg-background p-4">
          <DiagramPreview />
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
