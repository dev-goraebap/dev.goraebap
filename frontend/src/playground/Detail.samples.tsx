import type { Meta, SampleOf } from "../catalog/types";
import { LibrarySample } from "./library-sample";

/** 상세 템플릿: 본문과 속성 두 열, 좁으면 속성이 본문 위로 접힌다. 휴대폰은 앱 바와 하단 탭 없이 ←와 바닥 동작 줄. */
const meta = {
  title: "Playground (플레이그라운드)/상세", id: "playground-detail", component: LibrarySample,
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta<typeof LibrarySample>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Detail: Sample = { name: "상세", args: { initialPath: "/resources/long-title" } };
export const Phone: Sample = { name: "휴대폰", args: { initialPath: "/resources/seed-loading" }, device: "phone" };
