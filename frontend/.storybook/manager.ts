import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";
addons.setConfig({
  theme: create({ base: "light", brandTitle: "고래밥 워크플로우 · 화면 패턴" }),
  sidebar: { showRoots: true },
  panelPosition: "bottom",
});
