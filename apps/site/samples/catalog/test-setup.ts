// 검사는 모든 견본을 한 문서에서 이어 그리므로 두 키트의 CSS를 함께 읽는다(가이드의 견본 iframe은 키트마다 고른다: SampleFrame).
// Astryx의 base.css가 레이어 순서(Tailwind 사이에 Astryx 레이어)를 먼저 정하고 글꼴도 읽는다.
import "@/shared/ui/foundations/base.css";
import "@/shared/styles/tailwind.css";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
