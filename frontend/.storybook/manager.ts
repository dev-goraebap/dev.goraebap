import { addons } from "storybook/manager-api";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import {
  catalogMode,
  catalogThemes,
  initialCatalogMode,
} from "./catalog-theme";
addons.setConfig({
  theme: catalogThemes[initialCatalogMode()],
  sidebar: { showRoots: true },
  layout: { panelPosition: "bottom" },
});
addons.register("goraebap/catalog-theme", (api) => {
  const update = ({ globals }: { globals: Record<string, unknown> }) => {
    addons.setConfig({ theme: catalogThemes[catalogMode(globals.theme)] });
  };
  update({ globals: api.getGlobals() });
  addons.getChannel().on(GLOBALS_UPDATED, update);
  addons.getChannel().on(SET_GLOBALS, update);
});
