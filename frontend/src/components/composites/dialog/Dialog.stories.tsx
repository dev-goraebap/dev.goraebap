import meta, * as reference from "../../../../reference/Dialog.stories";
export default {
  ...meta,
  parameters: { layout: "centered", docs: { story: { height: "420px" } } },
  id: "patterns-dialog",
  title: "조합 부품/공통 다이얼로그",
};
export const Basic = { ...reference.Basic, name: "기본" };
export const LongBody = { ...reference.LongBody, name: "긴 본문" };
export const FooterDivider = {
  ...reference.FooterDivider,
  name: "푸터 구분선",
};
export const Keyboard = { ...reference.Keyboard, name: "닫기와 초점 복귀" };
