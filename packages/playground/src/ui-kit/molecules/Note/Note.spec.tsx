import { render } from "@testing-library/react";

import { Note } from "./Note";
import { NotePom } from "./Note.pom";

describe("Note", () => {
  it("should show what it says as a note", () => {
    // Arrange
    render(<Note>The config has no problems.</Note>);
    const note = new NotePom();

    // Act
    const { role, text } = note;

    // Assert
    expect(role).toBe("note");
    expect(text).toBe("The config has no problems.");
  });

  it("should draw the info icon, hidden from assistive technology", () => {
    // Arrange
    render(<Note>The config has no problems.</Note>);
    const note = new NotePom();

    // Act
    const { isHidden } = note.icon;

    // Assert
    expect(isHidden).toBe(true);
  });

  it("should accept elements as content", () => {
    // Arrange
    render(
      <Note>
        Policy <code>2</code> is highlighted.
      </Note>
    );
    const note = new NotePom();

    // Act
    const { codeTexts } = note;

    // Assert
    expect(codeTexts).toEqual(["2"]);
  });
});
