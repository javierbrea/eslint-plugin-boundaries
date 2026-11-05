import { render } from "@testing-library/react";

import { RulesNote } from "./RulesNote";
import { RulesNotePom } from "./RulesNote.pom";

describe("RulesNote", () => {
  it("should say that the rules are not evaluated while their options are invalid", () => {
    // Arrange
    render(<RulesNote />);
    const note = new RulesNotePom();

    // Act
    const { text } = note;

    // Assert
    expect(text).toBe(
      "Dependencies are not evaluated while the rule options are invalid: ESLint does not run a rule whose options fail its schema."
    );
  });

  it("should be a note", () => {
    // Arrange
    render(<RulesNote />);
    const note = new RulesNotePom();

    // Act
    const { role } = note.note;

    // Assert
    expect(role).toBe("note");
  });

  it("should sit 6 px below the head of the panel and 16 px from its sides", () => {
    // Arrange
    render(<RulesNote />);
    const note = new RulesNotePom();

    // Act
    const { margin } = note;

    // Assert
    expect(margin).toBe("6px 16px 0px");
  });
});
