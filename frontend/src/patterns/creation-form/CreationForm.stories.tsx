import meta, * as reference from "../../../reference/CreationForm.stories";
export default {
  ...meta,
  parameters: { layout: "fullscreen", docs: { story: { height: "620px" } } },
  id: "patterns-creation",
  title: "사용 패턴/생성 양식",
};
export const Dialog = { ...reference.Dialog, name: "다이얼로그" };
export const Page = { ...reference.Page, name: "페이지" };
export const Mobile = { ...reference.Mobile, name: "모바일" };
export const Stepped = { ...reference.Stepped, name: "단계형 양식" };
