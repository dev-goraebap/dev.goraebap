// 키트 테마(frontend/reference/foundations/theme.ts)의 색·글꼴·곡률·그림자 토큰을 가이드용 CSS로 옮긴다.
// 값은 light-dark()로 두 모드를 함께 담으므로 가이드는 color-scheme만 바꾸면 된다. 가이드 빌드 전에 실행한다.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { workspaceTheme } from '../../frontend/reference/foundations/theme.ts';

const tokens = (workspaceTheme as unknown as { tokens: Record<string, string> }).tokens;
const kept = Object.entries(tokens).filter(([name]) => /^--(color-|font-family-|radius-|shadow-|focus-outline-)/.test(name));
const css = [
  '/* 생성 파일: site/scripts/kit-tokens.mts가 키트 테마에서 만든다. 직접 고치지 않는다. */',
  ':root {',
  ...kept.map(([name, value]) => `  ${name}: ${value};`),
  '}',
  '',
].join('\n');
const out = fileURLToPath(new URL('../src/styles/kit-tokens.css', import.meta.url));
writeFileSync(out, css);
console.log(`키트 토큰 ${kept.length}개 → ${out}`);
