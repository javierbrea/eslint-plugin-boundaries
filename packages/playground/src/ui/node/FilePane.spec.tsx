import { act, fireEvent, render, screen as view } from "@testing-library/react";

import { FilePane } from "./FilePane";

const PATH = "src/modules/checkout/index.js";

/**
 * Finds the button that adds a dependency.
 * @returns The button.
 */
function getAddButton(): HTMLButtonElement {
  return view.getByRole("button", { name: "Dependency" }) as HTMLButtonElement;
}

describe("FilePane", () => {
  it("should be the landmark of the node in focus", () => {
    // Arrange
    render(<FilePane path={PATH} />);

    // Act
    const landmark = view.getByRole("region", { name: "Node in focus" });

    // Assert
    expect(landmark.tagName).toBe("SECTION");
  });

  it("should show the file label and its path in the head", () => {
    // Arrange
    render(<FilePane path={PATH} />);

    // Act
    const path = view.getByText(PATH);

    // Assert
    expect(view.getByText("File").tagName).toBe("SPAN");
    expect(path.getAttribute("title")).toBe(PATH);
  });

  it("should say that the file has no dependencies yet", () => {
    // Arrange
    render(<FilePane path={PATH} />);

    // Act
    const message = view.getByText("No dependencies yet.");

    // Assert
    expect(message.tagName).toBe("P");
  });

  it("should draw no list of dependencies", () => {
    // Arrange
    render(<FilePane path={PATH} />);

    // Act
    const lists = view.queryAllByRole("list");

    // Assert
    expect(lists).toHaveLength(0);
  });

  it("should draw the button that adds a dependency, disabled", () => {
    // Arrange
    render(<FilePane path={PATH} />);

    // Act
    const button = getAddButton();

    // Assert
    expect(button.disabled).toBe(true);
    expect(button.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true"
    );
  });

  it("should show why the button is disabled when the pointer is over it", async () => {
    // Arrange
    render(<FilePane path={PATH} />);

    // Act
    fireEvent.mouseOver(getAddButton().parentElement as HTMLElement);
    const tooltip = await view.findByRole("tooltip");

    // Assert
    expect(tooltip.textContent).toBe(
      "Dependencies arrive in the next milestone"
    );
  });

  it("should show why the button is disabled when the keyboard focus reaches it", async () => {
    // Arrange
    render(<FilePane path={PATH} />);
    const slot = getAddButton().parentElement as HTMLElement;

    // Act
    act(() => {
      slot.focus();
    });
    const tooltip = await view.findByRole("tooltip");

    // Assert
    expect(slot.tabIndex).toBe(0);
    expect(tooltip.textContent).toBe(
      "Dependencies arrive in the next milestone"
    );
  });
});
