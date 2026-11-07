import "../src/foundations/styles.css";
import './preview.css';
import type { Preview } from "@storybook/react-vite";
import { INITIAL_VIEWPORTS } from "storybook/viewport";
import { ReferenceTheme } from "../reference/ReferenceTheme";
import "../reference/catalog.css";
import { ThemedDocsContainer } from "./ThemedDocsContainer";
const preview: Preview = {
  initialGlobals: { theme: "light" },
  globalTypes: {
    theme: {
      description: "제품 테마",
      toolbar: {
        title: "테마",
        icon: "circlehollow",
        dynamicTitle: true,
        items: [
          { value: "light", title: "라이트" },
          { value: "dark", title: "다크" },
        ],
      },
    },
  },
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: {
        ...INITIAL_VIEWPORTS,
        desktop: {
          name: "데스크톱 1440",
          styles: { width: "1440px", height: "960px" },
          type: "desktop",
        },
      },
    },
    backgrounds: { disable: true },
    controls: { expanded: true },
    docs: {
      container: ThemedDocsContainer,
      story: { inline: false, height: "320px" },
      codePanel: true,
    },
    a11y: { test: "todo" },
    options: {
      storySort: {
        order: [
          "시작하기",
          "디자인 기초",
          "기본 부품",
          "조합 부품",
          "레이아웃",
          "사용 패턴",
          "화면 예제",
        ],
      },
    },
  },
  decorators: [
    (Story, context) => (
      <ReferenceTheme
        mode={context.globals.theme === "dark" ? "dark" : "light"}
      >
        <Story />
      </ReferenceTheme>
    ),
  ],
};
export default preview;
