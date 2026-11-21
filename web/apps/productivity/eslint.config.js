import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * 일반 린트. 화면 규칙(층 방향 · 색 토큰 · 아이콘 …)은 scripts/check-ui.mjs가 따로 맡는다.
 * 타입 정보가 필요한 규칙(사용 중단 호출)만 타입을 읽어 돌린다.
 */
export default tseslint.config(
  { ignores: ['dist', 'src/app/router/routeTree.gen.ts', 'src/shared/api/schema.d.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'unused-imports': unusedImports },
    rules: {
      // 안 쓰는 import는 --fix가 지운다. 안 쓰는 변수는 알리기만 한다(이름을 _로 시작하면 일부러 쓰지 않는 값).
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // 훅 규칙만 쓴다. React Compiler용 규칙(refs · set-state-in-effect …)은 컴파일러를 쓰지 않아 켜지 않는다.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // 사용 중단으로 표시된 API를 부르면 알린다(라이브러리가 다음 판에서 지울 것).
      '@typescript-eslint/no-deprecated': 'error',
      // 구조 없는 문서 JSON(ProseMirror 노드 · 속성)을 다루는 곳에 남아 있다. 새로 쓰지 않도록 알린다.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // 브라우저 페이지 안에서 도는 코드: public의 시작 스크립트와 서비스 워커, 화면 점검 스크립트(page.evaluate).
  { files: ['public/**/*.js'], languageOptions: { globals: { ...globals.browser, ...globals.serviceworker } } },
  { files: ['scripts/**/*.{mjs,js}', '*.{js,ts}'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
);
