import { render, screen as view } from "@testing-library/react";

import { Mono } from "./Mono";

describe("Mono", () => {
  it("should draw what it holds as code, inside the sentence", () => {
    // Arrange
    render(
      <p>
        Open <Mono>eslint.config.js</Mono> to edit the settings.
      </p>
    );

    // Act
    const code = view.getByText("eslint.config.js");

    // Assert
    expect(code.tagName).toBe("CODE");
    expect(code.parentElement?.tagName).toBe("P");
  });

  it("should use the mono font of the host and the size of the text around it", () => {
    // Arrange
    render(<Mono>src/index.js</Mono>);

    // Act
    const style = getComputedStyle(view.getByText("src/index.js"));

    // Assert
    expect(style.fontFamily).toBe("var(--jsb-font-mono)");
    expect(style.fontSize).toBe("inherit");
  });

  it("should reset the box that a host draws around code", () => {
    // Arrange
    render(<Mono>src/index.js</Mono>);

    // Act
    const style = getComputedStyle(view.getByText("src/index.js"));

    // Assert
    expect(parseFloat(style.padding)).toBe(0);
    expect(parseFloat(style.borderRadius)).toBe(0);
  });
});
