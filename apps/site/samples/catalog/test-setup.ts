// 검사도 견본 iframe(SampleFrame)과 같은 CSS(Tailwind 토큰 · 글꼴)를 읽는다.
import "@/shared/styles/tailwind.css";
import "@/shared/styles/fonts.css";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
