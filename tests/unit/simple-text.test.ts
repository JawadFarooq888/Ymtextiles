import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SimpleText } from "@/lib/simple-text";

const html = (text: string) => renderToStaticMarkup(createElement(SimpleText, { text }));

describe("SimpleText", () => {
  it("renders headings, lists, paragraphs, bold and links", () => {
    const out = html(
      "## Delivery\n\nWe ship **fast**.\nSecond line\n\n- One\n- Two [link](https://ymtextiles.com)",
    );
    expect(out).toBe(
      '<h2>Delivery</h2><p>We ship <strong>fast</strong>.<br/>Second line</p><ul><li>One</li><li>Two <a href="https://ymtextiles.com" target="_blank" rel="noopener noreferrer">link</a></li></ul>',
    );
  });

  it("never renders HTML or unsafe links", () => {
    const out = html("<script>alert(1)</script> [x](javascript:alert(1)) [y](//evil.com)");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
    expect(out).not.toContain('href="javascript');
    expect(out).not.toContain('href="//evil');
  });

  it("allows internal, mailto and tel links", () => {
    expect(html("[a](/pages/contact) [b](mailto:a@b.com) [c](tel:+447)")).toContain(
      'href="/pages/contact"',
    );
  });
});
