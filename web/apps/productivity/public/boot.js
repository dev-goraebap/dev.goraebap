// 앱 코드가 준비되기 전에도 저장한 모드를 적용한다.
let mode = 'system';
let theme = 'stone';
try {
  const saved = JSON.parse(localStorage.getItem('cowork-appearance') || '{}');
  mode = saved.mode; theme = saved.color;
} catch { /* Use the device mode when storage is unavailable. */ }
const dark = mode === 'dark' || (mode !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
// The shadcn tokens' mode (app/theme/tailwind.css); the app keeps it from here (app/providers/AppTheme).
document.documentElement.dataset.theme = dark ? 'dark' : 'light';
const themeColor = document.querySelector('meta[name="theme-color"]');
if (themeColor) {
  let palette;
  try { palette = JSON.parse(themeColor.dataset.palettes || '{}')[theme]; } catch { /* default palette */ }
  const index = dark ? 1 : 0;
  if (palette) {
    document.documentElement.style.setProperty('--boot-body', palette.body[index]);
    document.documentElement.style.setProperty('--boot-surface', palette.surface[index]);
    document.documentElement.style.setProperty('--boot-secondary', palette.secondary[index]);
  }
  const color = palette ? palette.surface[index] : dark ? themeColor.dataset.dark : themeColor.dataset.light;
  themeColor.content = color;
  document.documentElement.style.backgroundColor = color;
}
