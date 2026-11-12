import type { Meta, SampleOf } from "../catalog/types";
import { OnboardingApp } from "./onboarding/app/OnboardingApp";

/** 첫 로그인 뒤 화면 테마·프로필·알림을 정하는 네 단계 온보딩입니다. */
const meta = {
  title: "Playground (플레이그라운드)/온보딩", id: "playground-onboarding", component: OnboardingApp,
  layout: "fullscreen", height: "40rem", device: "desktop", kit: "shadcn",
} satisfies Meta<typeof OnboardingApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Welcome: Sample = {name:"화면 테마",args:{initialPath:"/setup"}};
export const Profile: Sample = {name:"프로필",args:{initialPath:"/setup?step=1"}};
export const Notifications: Sample = {name:"알림",args:{initialPath:"/setup?step=2"}};
export const Done: Sample = {name:"완료",args:{initialPath:"/setup?step=3"}};
