import { render, screen as view } from "@testing-library/react";

import { Note } from "./Note";

describe("Note", () => {
  it("should show what it says as a note", () => {
    // Arrange
    render(<Note>The config has no problems.</Note>);

    // Act
    const note = view.getByRole("note");

    // Assert
    expect(note.textContent).toBe("The config has no problems.");
  });

  it("should draw the info icon, hidden from assistive technology", () => {
    // Arrange
    render(<Note>The config has no problems.</Note>);

    // Act
    const icon = view.getByRole("note").querySelector("svg");

    // Assert
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
  });

  it("should accept elements as content", () => {
    // Arrange
    render(
      <Note>
        Policy <code>2</code> is highlighted.
      </Note>
    );

    // Act
    const code = view.getByRole("note").querySelector("code");

    // Assert
    expect(code?.textContent).toBe("2");
  });
});
