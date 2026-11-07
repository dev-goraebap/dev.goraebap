import meta, * as reference from "../../../../skills/design-system/assets/workspace/AppLayout.stories";
export default {
  ...meta,
  parameters: { layout: "fullscreen", docs: { story: { height: "620px" } } },
  id: "patterns-layout",
  title: "레이아웃/Split·Inset",
};
export const Inset = { ...reference.Inset, name: "Inset" };
export const Split = { ...reference.Split, name: "Split" };
export const LongList = { ...reference.LongList, name: "긴 목록" };
export const Mobile = { ...reference.Mobile, name: "모바일" };
