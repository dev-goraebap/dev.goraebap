import { describe, expect, test } from "vitest";
import { groupOfPath, samplesOf } from "./registry";
import { runSample } from "./run-sample";
import type { SampleModule } from "./types";

/** 모든 견본이 데스크톱과 휴대폰 모두에서 오류 없이 그려지는지 확인한다. 조작 검증은 각 묶음의 `*.test.tsx`에 있다. */
const modules = import.meta.glob<SampleModule>("../**/*.samples.tsx", { eager: true });

for (const [path, module] of Object.entries(modules)) {
  describe(module.default.title, () => {
    // 가이드는 주소의 묶음 id로 파일을 찾는다.
    test("묶음 id가 파일 위치와 같다", () => expect(module.default.id).toBe(groupOfPath(path)));
    for (const entry of samplesOf(module)) {
      test(`${entry.name} · 데스크톱`, () => runSample(entry.meta, entry.sample, "desktop"));
      test(`${entry.name} · 휴대폰`, () => runSample(entry.meta, entry.sample, "phone"));
    }
  });
}
