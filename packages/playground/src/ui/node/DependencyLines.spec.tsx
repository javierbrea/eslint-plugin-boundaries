import { render, screen as view } from "@testing-library/react";

import { DependencyLines } from "./DependencyLines";
import type { DependencyLine } from "./DependencyLines.types";

const LINES: readonly DependencyLine[] = [
  { id: "first", statement: 'import { format } from "../../helpers/format";' },
  { id: "second", statement: <code>{'import React from "react";'}</code> },
];

describe("DependencyLines", () => {
  it("should draw nothing for an empty list", () => {
    // Arrange
    const lines: readonly DependencyLine[] = [];

    // Act
    const { container } = render(<DependencyLines lines={lines} />);

    // Assert
    expect(container.childElementCount).toBe(0);
  });

  it("should draw one line for each dependency, in order", () => {
    // Arrange
    render(<DependencyLines lines={LINES} />);

    // Act
    const items = view.getAllByRole("listitem");

    // Assert
    expect(items.map((item) => item.textContent)).toEqual([
      '1import { format } from "../../helpers/format";',
      '2import React from "react";',
    ]);
  });

  it("should number the lines from 1, as the editor numbers them", () => {
    // Arrange
    render(<DependencyLines lines={LINES} />);

    // Act
    const numbers = view
      .getAllByRole("listitem")
      .map((item) => item.firstElementChild?.textContent);

    // Assert
    expect(numbers).toEqual(["1", "2"]);
  });

  it("should accept elements as the statement", () => {
    // Arrange
    render(<DependencyLines lines={LINES} />);

    // Act
    const code = view.getByText('import React from "react";');

    // Assert
    expect(code.tagName).toBe("CODE");
  });
});
