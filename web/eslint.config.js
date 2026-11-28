import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/public/r/**",
      "**/routeTree.gen.ts",
      "**/.angular/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  {
    // 빌드·검사 스크립트는 Node에서 돈다.
    files: ["**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
  {
    // 정적 PWA 서비스 워커는 ServiceWorkerGlobalScope에서 돈다.
    files: ["**/public/sw.js"],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: [
      "apps/*/src/pages/**/{__root,route,page}.tsx",
      "packages/ui-react/src/components/**/*.{ts,tsx}",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  eslintConfigPrettier,
);
