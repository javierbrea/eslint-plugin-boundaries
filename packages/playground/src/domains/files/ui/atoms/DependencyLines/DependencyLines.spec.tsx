import { render } from "@testing-library/react";

import { renderInRoot } from "@/shared/testing/renderInRoot";
import { ThemeRootPom } from "@/ui-kit/providers/ThemeRoot/ThemeRoot.pom";

import { DependencyLines } from "./DependencyLines";
import { DependencyLinesPom } from "./DependencyLines.pom";
import type { DependencyLine } from "./DependencyLines.types";

const LINES: readonly DependencyLine[] = [
  { id: "first", statement: 'import { format } from "../../helpers/format";' },
  { id: "second", statement: <code>{'import React from "react";'}</code> },
];

describe("DependencyLines", () => {
  it("should draw nothing for an empty list", () => {
    // Arrange
    const lines: readonly DependencyLine[] = [];
    renderInRoot(<DependencyLines lines={lines} />);
    const root = new ThemeRootPom();

    // Act
    const { isEmpty } = root;

    // Assert
    expect(isEmpty).toBe(true);
  });

  it("should draw one line for each dependency, in order", () => {
    // Arrange
    render(<DependencyLines lines={LINES} />);
    const list = new DependencyLinesPom();

    // Act
    const { lineTexts } = list;

    // Assert
    expect(lineTexts).toEqual([
      '1import { format } from "../../helpers/format";',
      '2import React from "react";',
    ]);
  });

  it("should number the lines from 1, as the editor numbers them", () => {
    // Arrange
    render(<DependencyLines lines={LINES} />);
    const list = new DependencyLinesPom();

    // Act
    const { lineNumbers } = list;

    // Assert
    expect(lineNumbers).toEqual(["1", "2"]);
  });

  it("should accept elements as the statement", () => {
    // Arrange
    render(<DependencyLines lines={LINES} />);
    const [, line] = new DependencyLinesPom().lines;

    // Act
    const { statementElementTag } = line;

    // Assert
    expect(statementElementTag).toBe("CODE");
  });
});
