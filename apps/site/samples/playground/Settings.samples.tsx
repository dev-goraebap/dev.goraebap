import type { Meta, SampleOf } from "../catalog/types";
import { LibrarySample } from "./library-sample";

/** 설정 템플릿: 약 720px 열 안에 묶음별 행, 바꾸면 그 자리에서 반영한다. */
const meta = {
  title: "Playground (플레이그라운드)/설정", id: "playground-settings", component: LibrarySample,
  layout: "fullscreen", height: "36rem", device: "desktop", kit: "shadcn",
} satisfies Meta<typeof LibrarySample>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Display: Sample = { name: "화면 설정", args: { initialPath: "/settings" } };
