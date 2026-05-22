import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { FilterChip } from "./FilterChip";

describe("FilterChip", () => {
  it("exposes pressed state", () => {
    render(() => (
      <>
        <FilterChip label="Active" active onClick={vi.fn()} />
        <FilterChip label="Inactive" active={false} onClick={vi.fn()} />
      </>
    ));

    expect(screen.getByRole("button", { name: "Active" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Inactive" })).toHaveAttribute("aria-pressed", "false");
  });
});
