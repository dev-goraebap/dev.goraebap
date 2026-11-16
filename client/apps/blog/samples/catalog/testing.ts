/** 견본의 `play`가 쓰는 검사 도구. 화면 조작은 Testing Library, 확인은 Vitest expect와 jest-dom 맞춤 검사기다. */
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

expect.extend(matchers);

export { expect };
export { waitFor, within } from "@testing-library/dom";
export { userEvent } from "@testing-library/user-event";
