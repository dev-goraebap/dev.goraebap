import { render } from "@testing-library/react";
import { Component, type ReactNode } from "react";
import { page } from "vitest/browser";
import { SampleView } from "./SampleView";
import type { Meta, Sample } from "./types";

class Catch extends Component<{ onError: (error: unknown) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { this.props.onError(error); }
  render() { return this.state.failed ? null : this.props.children; }
}

/** 견본을 가이드와 같은 틀로 그리고(휴대폰 견본은 390×844 창) `play`를 실행한다. 그리기 중 오류는 실패로 올린다. */
export async function runSample(meta: Meta, sample: Sample) {
  const isPhone = (sample.device ?? meta.device) === "phone";
  await page.viewport(isPhone ? 390 : 1440, isPhone ? 844 : 960);
  let failure: unknown;
  const view = render(<Catch onError={error => { failure = error; }}>
    <SampleView meta={meta} sample={sample} mode="light" layout={sample.layout ?? meta.layout ?? "centered"} />
  </Catch>);
  await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
  if (failure) throw failure;
  await sample.play?.({ canvasElement: view.container });
  if (failure) throw failure;
}
