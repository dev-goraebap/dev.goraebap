import "@/shared/ui/foundations/base.css";
import "@/shared/styles/tailwind.css";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
