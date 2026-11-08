import { defineTheme } from '@astryxdesign/core/theme';
import { stoneTheme as stoneSource } from '@astryxdesign/theme-stone';
import { themeColors } from './colors';

/*
 * Stone 위에 조밀한 업무 화면의 기준을 테마로만 표현한다. Astryx 내부 클래스 덮어쓰기와 !important는 쓰지 않는다.
 * 테마가 다루지 못하는 반응형 크기는 responsive.css, 전역 스크롤바·큰 화면 배율은 base.css가 맡는다.
 */
const mix = (ink: number, base = 'var(--color-background-surface)') => `color-mix(in srgb, var(--color-text-primary) ${ink}%, ${base})`;
const tint = (ink: number) => `color-mix(in srgb, var(--color-text-primary) ${ink}%, transparent)`;

/** 이름 있는 입력 칸: 36px(휴대폰 48px), 안쪽 12px, 모서리 8px, 자체 채움 없음, 초점에서도 같은 선. */
const field = {
  base: {
    '--size-element-sm': 'var(--app-field-height)',
    '--size-element-md': 'var(--app-field-height)',
    '--size-element-lg': 'var(--app-field-height)',
    '--spacing-2': '0.75rem',
    '--radius-element': '0.5rem',
    '--color-accent': 'var(--color-border-emphasized)',
    '--color-accent-muted': 'transparent',
    '--color-background-surface': 'transparent',
    ':hover': { boxShadow: 'none' },
  },
};

export const workspaceTheme = defineTheme({
  name: 'workspace-reference',
  extends: stoneSource,
  typography: {
    body: { family: 'Pretendard Variable', fallbacks: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif' },
    code: { family: 'JetBrains Mono Variable', fallbacks: 'SF Mono, Consolas, monospace' },
  },
  tokens: {
    // 기준 색: 바닥·페이지 면·글자·강조. 나머지는 여기서 섞어 만든다.
    '--color-background-body': [...themeColors.body],
    '--color-background-surface': [...themeColors.surface],
    '--color-background-muted': ['#ececed', '#232326'],
    '--color-text-primary': ['#1b1b1b', '#f7f8f8'],
    '--color-text-secondary': [...themeColors.secondary],
    '--color-icon-secondary': ['#6b6b6f', '#8a8f98'],
    '--color-accent': ['#1b1b1b', '#f7f8f8'],
    '--color-on-accent': ['#ffffff', 'color-mix(in srgb, var(--color-background-surface) 85%, #000000)'],
    // 내부 구분선은 border, 앱 경계·바깥 테두리·입력 칸은 한 단계 진한 border-emphasized.
    '--color-border': [mix(13), mix(11)],
    '--color-border-emphasized': [mix(18), mix(16)],
    '--color-accent-muted': ['color-mix(in srgb, var(--color-accent) 8%, transparent)', 'color-mix(in srgb, var(--color-accent) 12%, transparent)'],
    // 초점 고리는 강조색을 조금 누그러뜨려 요소 안쪽 경계에 그린다.
    '--focus-outline-color': 'color-mix(in srgb, var(--color-accent) 72%, var(--color-background-surface))',
    '--focus-outline-offset': 'calc(-1 * var(--focus-outline-width))',
    '--color-icon-accent': 'var(--color-accent)',
    '--color-text-accent': 'var(--color-accent)',
    '--color-background-card': ['color-mix(in srgb, var(--color-background-surface) 25%, #ffffff)', mix(3)],
    '--color-background-popover': ['color-mix(in srgb, var(--color-background-surface) 15%, #ffffff)', mix(6)],
    '--color-background-gray': [mix(10), mix(13)],
    '--color-text-disabled': 'color-mix(in srgb, var(--color-text-secondary) 62%, var(--color-background-surface))',
    '--color-icon-primary': mix(88),
    '--color-overlay-hover': [tint(4), tint(5)],
    '--color-overlay-pressed': [tint(7), tint(8)],
    '--color-overlay': ['rgb(0 0 0 / 0.4)', 'rgb(0 0 0 / 0.55)'],
    '--color-shadow': ['rgb(0 0 0 / 0.04)', 'rgb(0 0 0 / 0.3)'],
    // 글자 12·13·15·24px, 기본 굵기 450.
    '--font-size-base': '0.8125rem',
    '--font-weight-normal': '450',
    '--text-body-size': '0.8125rem',
    '--text-body-leading': '1.5',
    '--text-label-size': '0.8125rem',
    '--text-supporting-size': '0.75rem',
    '--text-large-size': '0.9375rem',
    '--text-heading-1-size': '1.5rem',
    '--text-heading-2-size': '1.25rem',
    '--text-heading-3-size': '0.9375rem',
    '--text-heading-3-weight': '600',
    '--text-heading-4-size': '0.8125rem',
    '--text-heading-4-weight': '600',
    // 간격은 rem으로 두어 큰 화면의 루트 배율에서 글자와 함께 커진다.
    '--spacing-0-5': '0.125rem',
    '--spacing-1': '0.25rem',
    '--spacing-1-5': '0.375rem',
    '--spacing-2': '0.5rem',
    '--spacing-3': '0.75rem',
    '--spacing-4': '1rem',
    '--spacing-5': '1.25rem',
    '--spacing-6': '1.5rem',
    '--spacing-7': '1.75rem',
    '--spacing-8': '2rem',
    '--spacing-9': '2.25rem',
    '--spacing-10': '2.5rem',
    '--spacing-11': '2.75rem',
    '--spacing-12': '3rem',
    // 자리를 차지하는 것은 8px, 떠 있는 것은 12px. 컨트롤 높이 24·28·32px.
    '--radius-inner': '0.25rem',
    '--radius-element': '0.5rem',
    '--radius-container': '0.75rem',
    '--size-element-sm': '1.5rem',
    '--size-element-md': '1.75rem',
    '--size-element-lg': '2rem',
    '--shadow-med': '0 6px 18px light-dark(rgb(0 0 0 / 0.02), rgb(0 0 0 / 0.125)), 0 3px 9px light-dark(rgb(0 0 0 / 0.04), rgb(0 0 0 / 0.125)), 0 1px 1px light-dark(rgb(0 0 0 / 0.04), rgb(0 0 0 / 0.125))',
    '--shadow-high': '0 4px 40px light-dark(rgb(0 0 0 / 0.04), rgb(0 0 0 / 0.1)), 0 3px 20px light-dark(rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.125)), 0 3px 12px light-dark(rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.125)), 0 2px 8px light-dark(rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.125)), 0 1px 1px light-dark(rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.125))',
    '--duration-fast': '100ms',
    '--duration-medium': '250ms',
  },
  components: {
    // Astryx 토큰이 아닌 앱 값: 그림의 강조색, 페이지와 캔버스의 점 배경. 모든 화면이 놓이는 셸에 둔다.
    'app-shell': { base: {
      '--app-illustration-accent': 'light-dark(#4a7fd4, #6ea2ef)',
      '--app-page-dot': 'light-dark(rgb(0 0 0 / 0.07), rgb(255 255 255 / 0.07))',
      '--app-canvas-dot': 'light-dark(rgb(0 0 0 / 0.16), rgb(255 255 255 / 0.16))',
    } },
    // 상태 문구는 그림과 어울리도록 조용하게: 제목 1.125rem/500, 설명은 읽기 좋은 폭.
    'empty-state-title': { base: { fontSize: '1.125rem', fontWeight: '500', color: 'var(--color-text-secondary)' } },
    'empty-state-description': { base: { maxInlineSize: '28rem', fontSize: '0.8125rem', lineHeight: '1.6',
      color: 'color-mix(in srgb, var(--color-text-secondary) 72%, transparent)' } },
    // 누르는 것은 알약이다.
    button: {
      base: { borderRadius: 'var(--radius-full)' },
      // 페이지의 만들기 동작: 알약이 아닌 squircle, 굵은 글자, 강조색의 옅은 빛. 다이얼로그의 주 버튼은 알약으로 남는다.
      'variant:create': {
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-on-accent)',
        borderRadius: '0.625rem',
        cornerShape: 'squircle',
        fontWeight: '600',
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.12), 0 4px 14px -6px color-mix(in srgb, var(--color-accent) 70%, transparent)',
        ':hover': { backgroundColor: 'color-mix(in srgb, var(--color-accent) 88%, var(--color-background-surface))' },
      },
      // 뷰·탭: 옅은 채움의 알약, 선택은 한 단계 진한 view-active. ToggleButton의 눌림 상태는 테마가 칠할 수 없어 변형으로 둔다.
      'variant:view': {
        gap: 'var(--spacing-1)',
        paddingBlock: 'var(--spacing-1)',
        backgroundColor: 'var(--color-background-muted)',
        color: 'var(--color-text-secondary)',
        ':hover': { color: 'var(--color-text-primary)', backgroundColor: 'var(--color-background-gray)' },
      },
      'variant:view-active': {
        gap: 'var(--spacing-1)',
        paddingBlock: 'var(--spacing-1)',
        backgroundColor: 'var(--color-background-gray)',
        color: 'var(--color-text-primary)',
        boxShadow: `inset 0 0 0 1px ${tint(10)}`,
      },
      // 페이지의 둥근 도구(검색·필터·표시): 뷰 알약의 채움에 한 단계 진한 가는 선. 켜지면 view-active.
      'variant:tool': {
        backgroundColor: 'var(--color-background-muted)',
        color: 'var(--color-text-secondary)',
        boxShadow: `inset 0 0 0 1px ${tint(9)}`,
        ':hover': { color: 'var(--color-text-primary)', backgroundColor: 'var(--color-background-gray)' },
      },
      // 사이드바 머리의 상자 버튼: 도구의 채움과 선을 메뉴 항목의 squircle에 담는다.
      'variant:box': {
        backgroundColor: 'var(--color-background-muted)',
        color: 'var(--color-text-secondary)',
        borderRadius: '0.625rem',
        cornerShape: 'squircle',
        boxShadow: `inset 0 0 0 1px ${tint(9)}`,
        ':hover': { color: 'var(--color-text-primary)', backgroundColor: 'var(--color-background-gray)' },
      },
      // 보조 글자색의 조용한 동작. 포인터 아래에서만 채운다.
      'variant:subtle': {
        backgroundColor: 'transparent',
        color: 'var(--color-text-secondary)',
        ':hover': { backgroundColor: 'var(--color-background-muted)', color: 'var(--color-text-primary)' },
      },
    },
    'chat-composer-input': { base: { '--text-body-size': 'var(--app-composer-font-size, var(--font-size-base))' } },
    'text-input': field,
    'field-status': { 'variant:attached': { marginTop: 'var(--spacing-1)', borderRadius: 'var(--radius-element)', position: 'relative', zIndex: '0' } },
    'text-area': field,
    selector: field,
    typeahead: field,
    'field-label': { base: { '--font-weight-medium': '500', '--color-text-secondary': mix(90) } },
    // 카드는 16px squircle. inset의 페이지 면은 페이지 바탕색이고 그 위의 카드가 한 단계 밝다.
    card: {
      base: { borderRadius: '1rem', cornerShape: 'squircle' },
      'variant:page': { backgroundColor: 'var(--color-background-surface)', border: '1px solid var(--color-border-emphasized)' },
      'elevation:low': { boxShadow: '0 1px 2px light-dark(rgb(0 0 0 / 0.03), rgb(0 0 0 / 0.25)), 0 2px 6px -2px light-dark(rgb(0 0 0 / 0.04), rgb(0 0 0 / 0.3))' },
    },
    // 사이드바 크기 조절 손잡이가 패널 끝을 반 픽셀 넘어 가로 스크롤을 만들지 않게 한다.
    'layout-panel': { base: { overflowX: 'hidden' } },
    'app-shell-sidenav': { 'variant:section': { borderInlineEndColor: 'var(--color-border-emphasized)' } },
    // 메뉴 글자는 보조 글자색으로 한 단계 누그러뜨리고, 포인터가 올라온 항목과 현재 항목만 본문 글자색으로 올린다.
    // 메뉴가 길어도 무겁지 않고 현재 위치가 먼저 읽힌다. 아이콘은 Astryx가 이미 같은 방식(보조 → 현재)으로 칠한다.
    'side-nav-item': {
      base: { borderRadius: '0.625rem', cornerShape: 'squircle', color: 'var(--color-text-secondary)', ':hover': { color: 'var(--color-text-primary)' } },
      'selected:selected': { color: 'var(--color-text-primary)' },
    },
    'side-nav-section': { base: { padding: '0.6875rem 0.25rem' } },
    // 행의 글자는 페이지 머리·툴바와 같은 16px 정렬선, 바탕과 구분선은 끝까지. 마지막 행 아래 구분선은 바깥 경계와 겹치지 않게 지운다.
    'list-item': { base: { paddingInline: '1rem', ':last-child': { borderBottomWidth: '0' } } },
    'table-cell': { base: { ':first-child': { paddingInlineStart: '1rem' }, ':last-child': { paddingInlineEnd: '1rem' } } },
    'table-header-cell': { base: { ':first-child': { paddingInlineStart: '1rem' }, ':last-child': { paddingInlineEnd: '1rem' } } },
    // 라벨은 버튼과 구분되는 알약이다.
    token: { base: { borderRadius: 'var(--radius-full)', paddingInline: 'var(--spacing-2)', paddingBlock: 'var(--spacing-0-5)',
      gap: 'var(--spacing-1)', minBlockSize: '1.375rem', lineHeight: '1.25' } },
    // 뜬 면: 팝오버는 12px 모서리와 옅은 그림자, 다이얼로그는 더 둥글고 깊다.
    'popover-surface': {
      base: { padding: 'var(--spacing-1-5)', border: '1px solid var(--color-border-emphasized)', borderRadius: 'var(--radius-container)',
        background: 'var(--color-background-popover)', boxShadow: 'var(--shadow-med)' },
    },
    dialog: {
      base: { border: '1px solid var(--color-border-emphasized)', borderRadius: '1rem', background: 'var(--color-background-popover)', boxShadow: 'var(--shadow-high)' },
    },
  },
});
