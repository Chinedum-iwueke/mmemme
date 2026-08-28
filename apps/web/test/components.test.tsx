import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Badge, Button, FormError, Input, Pagination } from "../components/ui";
describe("web UI accessibility contract", () => {
  it("exposes busy and disabled button state", () => {
    const html = renderToStaticMarkup(<Button busy>Submitting request</Button>);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
  });
  it("associates field errors", () => {
    const html = renderToStaticMarkup(
      <Input name="email" label="Receipt email" error="Enter a valid email" />,
    );
    expect(html).toContain('for="field-email"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="field-email-help"');
  });
  it("announces errors and pagination", () => {
    expect(renderToStaticMarkup(<FormError>Fix email</FormError>)).toContain('role="alert"');
    const page = renderToStaticMarkup(<Pagination page={1} pages={2} />);
    expect(page).toContain('aria-label="Pagination"');
    expect(page).toContain("disabled");
  });
  it("never relies on tone without readable status", () =>
    expect(renderToStaticMarkup(<Badge tone="success">Booking confirmed</Badge>)).toContain(
      "Booking confirmed",
    ));
  it("ships keyboard, reduced-motion and compact responsive CSS", () => {
    const css =
      readFileSync(new URL("../components/ui/ui.css", import.meta.url), "utf8") +
      readFileSync(new URL("../app/design-system/gallery.css", import.meta.url), "utf8");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toMatch(/max-width:\s*599px/);
  });
});
