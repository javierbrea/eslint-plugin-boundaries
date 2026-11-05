import { render } from "@testing-library/react";

import { Mono } from "./Mono";
import { MonoPom } from "./Mono.pom";

describe("Mono", () => {
  it("should draw what it holds as code, inside the sentence", () => {
    // Arrange
    render(
      <p>
        Open <Mono>eslint.config.js</Mono> to edit the settings.
      </p>
    );
    const mono = new MonoPom();

    // Act
    const { text, tagName, parentTagName } = mono;

    // Assert
    expect(text).toBe("eslint.config.js");
    expect(tagName).toBe("CODE");
    expect(parentTagName).toBe("P");
  });

  it("should use the mono font of the host and the size of the text around it", () => {
    // Arrange
    render(<Mono>src/index.js</Mono>);
    const mono = new MonoPom();

    // Act
    const { fontFamily, fontSize } = mono;

    // Assert
    expect(fontFamily).toBe("var(--jsb-font-mono)");
    expect(fontSize).toBe("inherit");
  });

  it("should reset the box that a host draws around code", () => {
    // Arrange
    render(<Mono>src/index.js</Mono>);
    const mono = new MonoPom();

    // Act
    const { padding, borderRadius } = mono;

    // Assert
    expect(parseFloat(padding)).toBe(0);
    expect(parseFloat(borderRadius)).toBe(0);
  });
});
