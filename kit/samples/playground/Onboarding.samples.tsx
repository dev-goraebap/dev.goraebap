import type { Meta, SampleOf } from "../catalog/types";
import { OnboardingApp } from "./onboarding/app/OnboardingApp";

/**
 * 처음 쓰는 사람에게 보이는 화면을 만들 때 본뜬다. 빈 작업 공간은 그림 대신 큰 선택지 셋으로 시작하고, 설정은 진행 표시가 있는
 * 체크리스트로 하나씩 마치거나 나중으로 미루며, 견본 데이터로 채운 목록은 그 견본만 되돌릴 수 있다.
 */
const meta = {
  title: "Playground (플레이그라운드)/처음 시작", id: "playground-onboarding", component: OnboardingApp,
  layout: "fullscreen", height: "40rem", device: "desktop",
} satisfies Meta<typeof OnboardingApp>;
export default meta;
type Sample = SampleOf<typeof meta>;

export const Welcome: Sample = { name: "첫 화면", args: { initialPath: "/", seed: "empty" } };
export const Checklist: Sample = { name: "체크리스트 진행 중", args: { initialPath: "/setup", seed: "progress" } };
export const Projects: Sample = { name: "프로젝트가 생긴 뒤", args: { initialPath: "/", seed: "progress" } };
