import { render, screen as view } from "@testing-library/react";

import { Root } from "./Root";
import { ROOT_CLASS } from "./Theme";

/**
 * Renders content inside the root element.
 * @returns The root element.
 */
function renderRoot(): HTMLElement {
  const { container } = render(
    <Root>
      <p>Content of the playground</p>
    </Root>
  );

  return container.querySelector(`.${ROOT_CLASS}`) as HTMLElement;
}

describe("Root", () => {
  it("should hold its content in an element with the class of the root", () => {
    // Act
    const root = renderRoot();

    // Assert
    expect(root.contains(view.getByText("Content of the playground"))).toBe(
      true
    );
  });

  it("should give the playground the card and the ink of the host's tokens", () => {
    // Act
    const style = getComputedStyle(renderRoot());

    // Assert
    expect(style.backgroundColor).toBe("var(--jsb-card)");
    expect(style.color).toBe("var(--jsb-ink)");
  });

  it("should give the playground a 13 px body font with a 1.45 line height", () => {
    // Act
    const style = getComputedStyle(renderRoot());

    // Assert
    expect(style.fontFamily).toBe("var(--jsb-font-body)");
    expect(style.fontSize).toBe("13px");
    expect(style.lineHeight).toBe("1.45");
  });

  it("should be as tall as its container", () => {
    // Act
    const style = getComputedStyle(renderRoot());

    // Assert
    expect(style.height).toBe("100%");
  });

  it("should count the border in its size", () => {
    // Act
    const style = getComputedStyle(renderRoot());

    // Assert
    expect(style.boxSizing).toBe("border-box");
  });
});
