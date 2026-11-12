import { render } from "@testing-library/react";

import { FixturePom } from "@/shared/testing/pom";
import { renderInRoot } from "@/shared/testing/renderInRoot";

import { SectionTitle } from "./SectionTitle";
import { SectionTitlePom } from "./SectionTitle.pom";

describe("SectionTitle", () => {
  it("should show the path or the name it describes", () => {
    // Arrange
    render(
      <div data-testid="section">
        <SectionTitle>src/modules/checkout/index.js</SectionTitle>
      </div>
    );
    const title = new SectionTitlePom({
      parent: new FixturePom({ testId: "section" }),
    });

    // Act
    const { text } = title;

    // Assert
    expect(text).toBe("src/modules/checkout/index.js");
  });

  it("should set the title in the mono text of the type scale, medium and on a taller line", () => {
    // Arrange
    renderInRoot(<SectionTitle>eslint.config.js</SectionTitle>);
    const title = new SectionTitlePom({ name: "eslint.config.js" });

    // Act
    const { fontFamily, fontSize, fontWeight, lineHeight } = title;

    // Assert
    expect(fontFamily).toBe("var(--jsb-font-mono)");
    expect(fontSize).toBe("12.5px");
    expect(fontWeight).toBe("500");
    expect(lineHeight).toBe("1.4");
  });

  it("should break a long path anywhere instead of cutting it", () => {
    // Arrange
    renderInRoot(<SectionTitle>src/modules/checkout/index.js</SectionTitle>);
    const title = new SectionTitlePom({
      name: "src/modules/checkout/index.js",
    });

    // Act
    const { overflowWrap } = title;

    // Assert
    expect(overflowWrap).toBe("anywhere");
  });
});
