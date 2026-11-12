/**
 * 사이트의 화면 설정을 저장하는 localStorage 키. 사이트(entities/preferences), 첫 방문 덮개(vite.config의 bootCover),
 * 견본 틀(sample.html · SampleFrame · samples/catalog/shell-layout)이 같은 키를 읽어야 해서 한곳에 둔다.
 * 값은 글자 하나다: 모드는 'light' · 'dark', 셸 배치는 'inset' · 'split'. 키를 바꾸면 이미 고른 방문자의 설정이 사라진다.
 */
export const THEME_KEY = 'guide-theme';
export const SHELL_LAYOUT_KEY = 'guide-layout';
