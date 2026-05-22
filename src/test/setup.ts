import "@testing-library/jest-dom/vitest";
import { cleanup } from "@solidjs/testing-library";
import { afterEach } from "vitest";

Object.defineProperty(window, "scrollTo", { value: () => undefined, writable: true });

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.location.hash = "";
});
