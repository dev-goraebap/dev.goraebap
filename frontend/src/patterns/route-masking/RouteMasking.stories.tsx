import meta, * as reference from "../../../../skills/design-system/assets/workspace/RouteMasking.stories";
export default {
  ...meta,
  parameters: { layout: "fullscreen", docs: { story: { height: "620px" } } },
  id: "patterns-routing",
  title: "사용 패턴/라우트 마스킹",
};
export const FromList = { ...reference.FromList, name: "목록에서 열기" };
export const Verification = {
  ...reference.Verification,
  name: "전환·초안 보존 검증",
};
export const Direct = { ...reference.Direct, name: "직접 진입" };
export const Mobile = { ...reference.Mobile, name: "모바일 전체 화면" };
