import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { FixturePom } from "@/shared/testing/pom";
import { renderInRoot } from "@/shared/testing/renderInRoot";

import { PaneHead } from "./PaneHead";
import { PaneHeadPom } from "./PaneHead.pom";

/**
 * Renders a head as the first child of a host, as a pane places it, so that the page object finds it without the text of its label.
 * @param head The head.
 * @returns The page object of the head.
 */
function renderInHost(head: ReactNode): PaneHeadPom {
  render(<div data-testid="pane">{head}</div>);

  return new PaneHeadPom({ parent: new FixturePom({ testId: "pane" }) });
}

describe("PaneHead", () => {
  it("should set the label in the small uppercase mono text of a pane", () => {
    // Arrange
    renderInRoot(<PaneHead label="Project" />);
    const head = new PaneHeadPom({ name: "Project" });

    // Act
    const { fontFamily, fontSize, fontWeight, letterSpacing, textTransform } =
      head.labelStyle;

    // Assert
    expect(fontFamily).toBe("var(--jsb-font-mono)");
    expect(fontSize).toBe("10.5px");
    expect(fontWeight).toBe("500");
    expect(letterSpacing).toBe("0.14em");
    expect(textTransform).toBe("uppercase");
  });

  it("should set the path in plain mono text, without the spacing and the case of the label", () => {
    // Arrange
    renderInRoot(<PaneHead label="File" path="src/index.js" />);
    const head = new PaneHeadPom({ name: "File" });

    // Act
    const { fontFamily, fontSize, letterSpacing, textTransform } =
      head.pathStyle;

    // Assert
    expect(fontFamily).toBe("var(--jsb-font-mono)");
    expect(fontSize).toBe("12px");
    expect(letterSpacing).toBe("0");
    expect(textTransform).toBe("none");
  });

  it("should set the hint in plain body text, without the spacing and the case of the label", () => {
    // Arrange
    renderInRoot(<PaneHead label="Project" hint="One path per line" />);
    const head = new PaneHeadPom({ name: "Project" });

    // Act
    const { fontFamily, fontSize, fontWeight, letterSpacing, textTransform } =
      head.hintStyle;

    // Assert
    expect(fontFamily).toBe("var(--jsb-font-body)");
    expect(fontSize).toBe("12px");
    expect(fontWeight).toBe("400");
    expect(letterSpacing).toBe("0");
    expect(textTransform).toBe("none");
  });

  it("should draw the head on the color of the navbar of the host, apart from what the pane shows", () => {
    // Arrange
    renderInRoot(<PaneHead label="Project" />);
    const head = new PaneHeadPom({ name: "Project" });

    // Act
    const { backgroundColor } = head;

    // Assert
    expect(backgroundColor).toBe("var(--jsb-paper)");
  });

  it("should set the hint in the muted color, which passes 4.5:1 on the head", () => {
    // Arrange
    renderInRoot(<PaneHead label="Project" hint="One path per line" />);
    const head = new PaneHeadPom({ name: "Project" });

    // Act
    const { hintColor } = head;

    // Assert
    expect(hintColor).toBe("var(--jsb-muted)");
  });

  it("should show the label", () => {
    // Arrange
    const head = renderInHost(<PaneHead label="Project" />);

    // Act
    const { label } = head;

    // Assert
    expect(label).toBe("Project");
  });

  it("should show the path with its full text as the title", () => {
    // Arrange
    render(<PaneHead label="File" path="src/modules/checkout/index.js" />);
    const head = new PaneHeadPom({ name: "File" });

    // Act
    const { path, pathTitle } = head;

    // Assert
    expect(path).toBe("src/modules/checkout/index.js");
    expect(pathTitle).toBe("src/modules/checkout/index.js");
  });

  it("should draw no path when it has none", () => {
    // Arrange
    render(<PaneHead label="Project" />);
    const head = new PaneHeadPom({ name: "Project" });

    // Act
    const { hasPath } = head;

    // Assert
    expect(hasPath).toBe(false);
  });

  it("should draw no path when only the end slot holds an element with a title", () => {
    // Arrange
    render(
      <PaneHead
        label="Problems"
        end={
          <button type="button" title="Collapse the panel">
            Collapse
          </button>
        }
        hint="A hint"
      />
    );
    const head = new PaneHeadPom({ name: "Problems" });

    // Act
    const { hasPath, hint } = head;

    // Assert
    expect(hasPath).toBe(false);
    expect(hint).toBe("A hint");
  });

  it("should show the hint", () => {
    // Arrange
    render(
      <PaneHead
        label="Project"
        hint="One path per line · dependencies indented"
      />
    );
    const head = new PaneHeadPom({ name: "Project" });

    // Act
    const { hint } = head;

    // Assert
    expect(hint).toBe("One path per line · dependencies indented");
  });

  it("should accept elements as the hint", () => {
    // Arrange
    render(
      <PaneHead
        label="Config"
        hint={
          <>
            JSON5 · the <code>settings</code> of an ESLint config
          </>
        }
      />
    );
    const head = new PaneHeadPom({ name: "Config" });

    // Act
    const { hintCodeTexts } = head;

    // Assert
    expect(hintCodeTexts).toEqual(["settings"]);
  });

  it("should list the code of the hint, and not the code of the end slot", () => {
    // Arrange
    render(
      <PaneHead
        label="Config"
        end={<code>Action</code>}
        hint={
          <>
            the <code>settings</code> and the <code>rules</code>
          </>
        }
      />
    );
    const head = new PaneHeadPom({ name: "Config" });

    // Act
    const { hintCodeTexts } = head;

    // Assert
    expect(hintCodeTexts).toEqual(["settings", "rules"]);
  });

  it("should show what the end slot holds", () => {
    // Arrange
    render(
      <PaneHead
        label="Problems"
        end={
          <>
            <button type="button">Sketch</button>
            <button type="button">Collapse</button>
          </>
        }
      />
    );
    const head = new PaneHeadPom({ name: "Problems" });

    // Act
    const { buttonLabels } = head;

    // Assert
    expect(buttonLabels).toEqual(["Sketch", "Collapse"]);
  });

  it("should place the label, the path, the end slot and the hint in that order", () => {
    // Arrange
    const head = renderInHost(
      <PaneHead
        label="Config"
        path="eslint.config.js"
        end={<button type="button">Action</button>}
        hint="JSON5"
      />
    );

    // Act
    const { itemTexts } = head;

    // Assert
    expect(itemTexts).toEqual([
      "Config",
      "eslint.config.js",
      "Action",
      "JSON5",
    ]);
  });

  it("should keep the hint at the end when there is no end slot", () => {
    // Arrange
    const head = renderInHost(<PaneHead label="Project" hint="A hint" />);

    // Act
    const { itemTexts } = head;

    // Assert
    expect(itemTexts).toEqual(["Project", "", "A hint"]);
  });
});
