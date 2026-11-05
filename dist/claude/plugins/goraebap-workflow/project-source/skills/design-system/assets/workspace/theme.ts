import { defineTheme } from '@astryxdesign/core/theme';
import { stoneTheme as stoneSource } from '@astryxdesign/theme-stone';

const mix = (ink: number, base = 'var(--color-background-surface)') => `color-mix(in srgb, var(--color-text-primary) ${ink}%, ${base})`;
const tint = (ink: number) => `color-mix(in srgb, var(--color-text-primary) ${ink}%, transparent)`;

const field = {
  base: {
    '--size-element-sm': '2.25rem',
    '--size-element-md': '2.25rem',
    '--size-element-lg': '2.25rem',
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

    '--color-background-body': ['#efeff0', '#09090a'],
    '--color-background-surface': ['#f9f9fa', '#121213'],
    '--color-background-muted': ['#ececed', '#232326'],
    '--color-border': ['#e4e4e5', '#212224'],
    '--color-text-primary': ['#1b1b1b', '#f7f8f8'],
    '--color-text-secondary': ['#5c5c5e', '#8a8f98'],
    '--color-icon-secondary': ['#6b6b6f', '#8a8f98'],
    '--color-accent': ['#1b1b1b', '#f7f8f8'],
    '--color-on-accent': ['#ffffff', 'color-mix(in srgb, var(--color-background-surface) 85%, #000000)'],

    '--color-accent-muted': ['color-mix(in srgb, var(--color-accent) 8%, transparent)', 'color-mix(in srgb, var(--color-accent) 12%, transparent)'],
    '--color-icon-accent': 'var(--color-accent)',
    '--color-text-accent': 'var(--color-accent)',
    '--color-background-card': ['color-mix(in srgb, var(--color-background-surface) 25%, #ffffff)', mix(3)],
    '--color-background-popover': ['color-mix(in srgb, var(--color-background-surface) 15%, #ffffff)', mix(6)],
    '--color-background-gray': [mix(10), mix(13)],
    '--color-border-emphasized': [mix(18), mix(16)],
    '--color-text-disabled': 'color-mix(in srgb, var(--color-text-secondary) 62%, var(--color-background-surface))',
    '--color-icon-primary': mix(88),
    '--color-overlay-hover': [tint(4), tint(5)],
    '--color-overlay-pressed': [tint(7), tint(8)],
    '--color-overlay': ['rgb(0 0 0 / 0.4)', 'rgb(0 0 0 / 0.55)'],
    '--color-shadow': ['rgb(0 0 0 / 0.04)', 'rgb(0 0 0 / 0.3)'],

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

    '--radius-inner': '0.25rem',
    '--radius-element': '0.5rem',
    '--radius-container': '0.75rem',

    '--radius-chat': '0.875rem',
    '--size-element-sm': '1.5rem',
    '--size-element-md': '1.75rem',
    '--size-element-lg': '2rem',
    '--shadow-med': '0 6px 18px light-dark(rgb(0 0 0 / 0.02), rgb(0 0 0 / 0.125)), 0 3px 9px light-dark(rgb(0 0 0 / 0.04), rgb(0 0 0 / 0.125)), 0 1px 1px light-dark(rgb(0 0 0 / 0.04), rgb(0 0 0 / 0.125))',
    '--shadow-high': '0 4px 40px light-dark(rgb(0 0 0 / 0.04), rgb(0 0 0 / 0.1)), 0 3px 20px light-dark(rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.125)), 0 3px 12px light-dark(rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.125)), 0 2px 8px light-dark(rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.125)), 0 1px 1px light-dark(rgb(0 0 0 / 0.05), rgb(0 0 0 / 0.125))',
    '--duration-fast': '100ms',
    '--duration-medium': '250ms',
  },
  components: {

    'app-shell': { base: { '--workspace-day-off': 'light-dark(#d1242f, #ff7b72)', '--workspace-saturday': 'light-dark(#0969da, #6cb6ff)',
      '--workspace-illustration-accent': 'light-dark(#4a7fd4, #6ea2ef)' } },

    'empty-state-title': { base: { fontSize: '1.125rem', fontWeight: '500', color: 'var(--color-text-secondary)' } },
    'empty-state-description': { base: { maxInlineSize: '28rem', fontSize: '0.8125rem', lineHeight: '1.6',
      color: 'color-mix(in srgb, var(--color-text-secondary) 72%, transparent)' } },

    button: {
      base: {
        borderRadius: 'var(--radius-full)',
      },

      'variant:create': {
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-on-accent)',
        borderRadius: '0.625rem',
        cornerShape: 'squircle',
        fontWeight: '600',
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.12), 0 4px 14px -6px color-mix(in srgb, var(--color-accent) 70%, transparent)',
        ':hover': { backgroundColor: 'color-mix(in srgb, var(--color-accent) 88%, var(--color-background-surface))' },
      },

      'variant:view': {
        gap: 'var(--spacing-1)',
        paddingBlockStart: 'calc(var(--spacing-2) + 1.5px)',
        paddingBlockEnd: 'calc(var(--spacing-2) - 1.5px)',
        backgroundColor: 'var(--color-background-muted)',
        color: 'var(--color-text-secondary)',
        ':hover': { color: 'var(--color-text-primary)', backgroundColor: 'var(--color-background-gray)' },
      },

      'variant:tool': {
        backgroundColor: 'var(--color-background-muted)',
        color: 'var(--color-text-secondary)',
        boxShadow: `inset 0 0 0 1px ${tint(9)}`,
        ':hover': { color: 'var(--color-text-primary)', backgroundColor: 'var(--color-background-gray)' },
      },

      'variant:box': {
        backgroundColor: 'var(--color-background-muted)',
        color: 'var(--color-text-secondary)',
        borderRadius: '0.625rem',
        cornerShape: 'squircle',
        boxShadow: `inset 0 0 0 1px ${tint(9)}`,
        ':hover': { color: 'var(--color-text-primary)', backgroundColor: 'var(--color-background-gray)' },
      },

      'variant:subtle': {
        backgroundColor: 'transparent',
        color: 'var(--color-text-secondary)',
        ':hover': { backgroundColor: 'var(--color-background-muted)', color: 'var(--color-text-primary)' },
      },
      'variant:view-active': {
        gap: 'var(--spacing-1)',
        paddingBlockStart: 'calc(var(--spacing-2) + 1.5px)',
        paddingBlockEnd: 'calc(var(--spacing-2) - 1.5px)',
        backgroundColor: 'var(--color-background-gray)',
        color: 'var(--color-text-primary)',
        boxShadow: `inset 0 0 0 1px ${tint(10)}`,
      },
    },
    'text-input': field,
    'text-area': field,
    selector: field,

    'field-label': { base: { '--font-weight-medium': '500', '--color-text-secondary': mix(90) } },

    card: {
      base: { borderRadius: '1rem', cornerShape: 'squircle' },

      'variant:page': { backgroundColor: 'var(--color-background-surface)' },
      'variant:page-flat': { backgroundColor: 'var(--color-background-surface)', borderRadius: '0', borderWidth: '0' },
      'elevation:low': { boxShadow: '0 1px 2px light-dark(rgb(0 0 0 / 0.03), rgb(0 0 0 / 0.25)), 0 2px 6px -2px light-dark(rgb(0 0 0 / 0.04), rgb(0 0 0 / 0.3))' },
    },

    'layout-panel': { base: { overflowX: 'hidden' } },

    'side-nav-item': { base: { borderRadius: '0.625rem', cornerShape: 'squircle' } },

    'side-nav-section': { base: { padding: '0.6875rem 0.25rem' } },

    'list-item': { base: { paddingInline: '1rem', ':last-child': { borderBottomWidth: '0' } } },

    'table-cell': { base: { ':first-child': { paddingInlineStart: '1rem' }, ':last-child': { paddingInlineEnd: '1rem' } } },
    'table-header-cell': { base: { ':first-child': { paddingInlineStart: '1rem' }, ':last-child': { paddingInlineEnd: '1rem' } } },

    token: { base: { borderRadius: 'var(--radius-full)' } },

    'popover-surface': {
      base: {
        padding: 'var(--spacing-1-5)', border: `1px solid light-dark(${tint(10)}, ${tint(12)})`, borderRadius: 'var(--radius-container)', background: 'var(--color-background-popover)', boxShadow: 'var(--shadow-med)' },
    },
    dialog: {
      base: { border: `1px solid light-dark(${tint(10)}, ${tint(12)})`, borderRadius: '1rem', background: 'var(--color-background-popover)', boxShadow: 'var(--shadow-high)' },
      'variant:standard': { marginBlock: '12dvh auto' },
    },
  },
});
