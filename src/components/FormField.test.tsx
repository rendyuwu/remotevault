import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("associates label and hint with rendered control", () => {
    render(() => (
      <FormField label="Host" hint="Use hostname or IP">
        {(field) => <input id={field.id} aria-describedby={field.describedBy} />}
      </FormField>
    ));

    const input = screen.getByLabelText("Host");
    const hint = screen.getByText("Use hostname or IP");

    expect(input).toHaveAttribute("aria-describedby", hint.id);
  });
});
