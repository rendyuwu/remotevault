import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Btn } from "./Btn";

describe("Btn", () => {
  it("exposes an accessible name for icon-only buttons", () => {
    render(() => <Btn icon="i-close" iconOnly ariaLabel="Close tab" />);

    expect(screen.getByRole("button", { name: "Close tab" })).not.toBeNull();
  });
});
