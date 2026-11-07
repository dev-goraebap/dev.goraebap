import "../src/foundations/styles.css";
import type { Preview } from "@storybook/react-vite";
import { INITIAL_VIEWPORTS } from "storybook/viewport";
import { ReferenceTheme } from "../../skills/design-system/assets/workspace/ReferenceTheme";
import "../../skills/design-system/assets/workspace/catalog.css";
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
    docs: { story: { inline: false, height: "620px" }, codePanel: true },
    a11y: { test: "todo" },
    options: {
      storySort: {
        order: ["시작하기", "기초", "컴포넌트", "패턴", "레이아웃", "예제"],
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
