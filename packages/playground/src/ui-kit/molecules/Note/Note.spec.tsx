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

  it("should list in order the code it holds", () => {
    // Arrange
    render(
      <Note>
        Open <code>a.js</code> before <code>b.js</code>.
      </Note>
    );
    const note = new NotePom();

    // Act
    const { codeTexts } = note;

    // Assert
    expect(codeTexts).toEqual(["a.js", "b.js"]);
  });

  it("should put the class it is given on its root", () => {
    // Arrange
    render(<Note className="placed">The config has no problems.</Note>);
    const note = new NotePom();

    // Act
    const { classNames } = note;

    // Assert
    expect(classNames).toContain("placed");
  });

  it("should have no outer margin, as the caller places it", () => {
    // Arrange
    render(<Note>The config has no problems.</Note>);
    const note = new NotePom();

    // Act
    const { margin } = note;

    // Assert
    expect(margin).toBe("");
  });

  it("should take the test id it is given in place of its own", () => {
    // Arrange
    render(<Note testId="rules-note">The config has no problems.</Note>);
    const note = new NotePom({ testId: "rules-note" });

    // Act
    const { text } = note;

    // Assert
    expect(text).toBe("The config has no problems.");
    expect(new NotePom().isRendered).toBe(false);
  });
});
