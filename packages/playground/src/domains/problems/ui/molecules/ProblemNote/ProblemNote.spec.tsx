import { render } from "@testing-library/react";

import { ProblemNote } from "./ProblemNote";
import { ProblemNotePom } from "./ProblemNote.pom";

describe("ProblemNote", () => {
  it("should say what it is given", () => {
    // Arrange
    render(<ProblemNote>Dependencies are not evaluated.</ProblemNote>);
    const note = new ProblemNotePom();

    // Act
    const { text } = note;

    // Assert
    expect(text).toBe("Dependencies are not evaluated.");
  });

  it("should be a note", () => {
    // Arrange
    render(<ProblemNote>Policy 2 is highlighted.</ProblemNote>);
    const note = new ProblemNotePom();

    // Act
    const { role } = note.note;

    // Assert
    expect(role).toBe("note");
  });

  it("should sit 6 px below the head of the panel and 16 px from its sides", () => {
    // Arrange
    render(<ProblemNote>Policy 2 is highlighted.</ProblemNote>);
    const note = new ProblemNotePom();

    // Act
    const { margin } = note;

    // Assert
    expect(margin).toBe("6px 16px 0px");
  });

  it("should take the test id it is given, so that several notes can be told apart", () => {
    // Arrange
    render(
      <>
        <ProblemNote>First.</ProblemNote>
        <ProblemNote testId="other-note">Second.</ProblemNote>
      </>
    );

    // Act
    const other = new ProblemNotePom({ testId: "other-note" });

    // Assert
    expect(other.text).toBe("Second.");
  });
});
