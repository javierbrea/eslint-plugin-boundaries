import { render, screen as view } from "@testing-library/react";

import { PaneHead } from "./PaneHead";

/**
 * Reads the text of each item of the head, in order.
 * @param container The element that holds the head.
 * @returns The text of the items.
 */
function getItemTexts(container: HTMLElement): (string | null)[] {
  return Array.from(container.firstElementChild?.children ?? []).map(
    (item) => item.textContent
  );
}

describe("PaneHead", () => {
  it("should show the label", () => {
    // Arrange
    render(<PaneHead label="Project" />);

    // Act
    const label = view.getByText("Project");

    // Assert
    expect(label.textContent).toBe("Project");
  });

  it("should show the path with its full text as the title", () => {
    // Arrange
    render(<PaneHead label="File" path="src/modules/checkout/index.js" />);

    // Act
    const path = view.getByText("src/modules/checkout/index.js");

    // Assert
    expect(path.getAttribute("title")).toBe("src/modules/checkout/index.js");
  });

  it("should draw no path when it has none", () => {
    // Arrange
    render(<PaneHead label="Project" />);

    // Act
    const titled = document.querySelector("[title]");

    // Assert
    expect(titled).toBeNull();
  });

  it("should show the hint", () => {
    // Arrange
    render(
      <PaneHead
        label="Project"
        hint="One path per line · dependencies indented"
      />
    );

    // Act
    const hint = view.getByText("One path per line · dependencies indented");

    // Assert
    expect(hint.textContent).toBe("One path per line · dependencies indented");
  });

  it("should accept elements as the hint", () => {
    // Arrange
    render(
      <PaneHead
        label="Config"
        hint={
          <>
            JSON5 · the <code>settings</code> of an ESLint config
          </>
        }
      />
    );

    // Act
    const code = view.getByText("settings");

    // Assert
    expect(code.tagName).toBe("CODE");
  });

  it("should show what the end slot holds", () => {
    // Arrange
    render(
      <PaneHead
        label="Problems"
        end={
          <>
            <button type="button">Sketch</button>
            <button type="button">Collapse</button>
          </>
        }
      />
    );

    // Act
    const buttons = view.getAllByRole("button");

    // Assert
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Sketch",
      "Collapse",
    ]);
  });

  it("should place the label, the path, the end slot and the hint in that order", () => {
    // Arrange
    const { container } = render(
      <PaneHead
        label="Config"
        path="eslint.config.js"
        end={<button type="button">Action</button>}
        hint="JSON5"
      />
    );

    // Act
    const texts = getItemTexts(container);

    // Assert
    expect(texts).toEqual(["Config", "eslint.config.js", "Action", "JSON5"]);
  });

  it("should keep the hint at the end when there is no end slot", () => {
    // Arrange
    const { container } = render(<PaneHead label="Project" hint="A hint" />);

    // Act
    const texts = getItemTexts(container);

    // Assert
    expect(texts).toEqual(["Project", "", "A hint"]);
  });
});
