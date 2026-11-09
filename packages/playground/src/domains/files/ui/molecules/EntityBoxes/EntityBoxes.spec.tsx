import { createEntityDescription } from "@/domains/evaluation/helpers/engine/entityDescription.mock";
import { getOpenPlaces } from "@/domains/files/ui/helpers/inspectorPlaces";
import type {
  InspectorChoices,
  InspectorPlace,
} from "@/domains/files/ui/helpers/inspectorPlaces";
import { renderInRoot } from "@/shared/testing/renderInRoot";

import { EntityBoxes } from "./EntityBoxes";
import { EntityBoxesPom } from "./EntityBoxes.pom";
import type { EntityBoxesProps } from "./EntityBoxes.types";

/** A file of an element with a parent, which a file category matches. */
const BUTTON_SPEC = createEntityDescription({
  element: {
    types: ["component"],
    path: "src/components/atoms/Button",
    fileInternalPath: "Button.spec.js",
    captured: { family: "atoms", name: "Button" },
    parents: [
      {
        types: ["family"],
        path: "src/components/atoms",
        captured: { name: "atoms" },
      },
    ],
    isUnknown: false,
  },
  file: {
    categories: ["test"],
    path: "src/components/atoms/Button/Button.spec.js",
    captured: { name: "Button" },
    isUnknown: false,
  },
});

/** A file of an element that no file category matches. */
const CHECKOUT = createEntityDescription({
  element: {
    types: ["module"],
    path: "src/modules/checkout",
    fileInternalPath: "index.js",
    isUnknown: false,
  },
  file: { path: "src/modules/checkout/index.js" },
});

/** A module outside the project, such as the target of `import { useState } from "react"`. */
const REACT = createEntityDescription({
  module: { origin: "external", source: "react" },
});

/**
 * Renders the boxes inside the root of the playground, with everything open or folded as the defaults say, and the choices that differ.
 * @param props The props that differ from the defaults: the `from` section, no choices and a spy for `onToggle`.
 * @param choices What the user chose to open or fold.
 * @returns The page object of the boxes.
 */
function renderBoxes(
  props: Partial<EntityBoxesProps> = {},
  choices: InspectorChoices = {}
): EntityBoxesPom {
  renderInRoot(
    <EntityBoxes
      description={BUTTON_SPEC}
      side="from"
      openPlaces={getOpenPlaces(choices)}
      onToggle={jest.fn()}
      {...props}
    />
  );
  return new EntityBoxesPom();
}

describe("EntityBoxes", () => {
  it("should draw the boxes element, file and module, in the order of the plugin", () => {
    // Arrange
    const boxes = renderBoxes();

    // Act
    const { boxNames } = boxes;

    // Assert
    expect(boxNames).toEqual(["element", "file", "module"]);
  });

  describe("the properties", () => {
    it("should list every property of the element of a file", () => {
      // Arrange
      const boxes = renderBoxes();

      // Act
      const { entries } = boxes.box("element");

      // Assert
      expect(entries).toEqual({
        types: '[ "component" ]',
        path: '"src/components/atoms/Button"',
        fileInternalPath: '"Button.spec.js"',
        captured: '{ family: "atoms", name: "Button" }',
        parents:
          '[ { types: [ "family" ], path: "src/components/atoms", captured: { name: "atoms" } } ]',
        isIgnored: "false",
        isUnknown: "false",
      });
    });

    it("should list every property of the file", () => {
      // Arrange
      const boxes = renderBoxes();

      // Act
      const { entries } = boxes.box("file");

      // Assert
      expect(entries).toEqual({
        categories: '[ "test" ]',
        path: '"src/components/atoms/Button/Button.spec.js"',
        captured: '{ name: "Button" }',
        isIgnored: "false",
        isUnknown: "false",
      });
    });

    it("should list every property of the module, once it is open", () => {
      // Arrange
      const boxes = renderBoxes({}, { "from.module": true });

      // Act
      const { entries } = boxes.box("module");

      // Assert
      expect(entries).toEqual({
        origin: '"local"',
        source: "null",
        internalPath: "null",
      });
    });

    it("should list the properties of an external module, which no element or file descriptor matches", () => {
      // Arrange
      const boxes = renderBoxes(
        { description: REACT, side: "to" },
        { "to.module": true }
      );

      // Act
      const element = boxes.box("element").entries;
      const file = boxes.box("file").entries;
      const moduleEntries = boxes.box("module").entries;

      // Assert
      expect(element).toEqual({
        types: "null",
        path: "null",
        fileInternalPath: "null",
        captured: "null",
        parents: "[]",
        isIgnored: "false",
        isUnknown: "true",
      });
      expect(file).toEqual({
        categories: "null",
        path: "null",
        captured: "null",
        isIgnored: "false",
        isUnknown: "true",
      });
      expect(moduleEntries).toEqual({
        origin: '"external"',
        source: '"react"',
        internalPath: "null",
      });
    });

    it("should draw a null value apart from the others", () => {
      // Arrange
      const element = renderBoxes({ description: CHECKOUT }).box("element");

      // Act
      const captured = element.valueColor("captured");
      const types = element.valueColor("types");

      // Assert
      expect(captured).toBe("var(--jsb-faint)");
      expect(types).not.toBe(captured);
    });
  });

  describe("the state of each box", () => {
    it("should open the element and the file, and fold the module, until the user chooses", () => {
      // Arrange
      const boxes = renderBoxes();

      // Act
      const states = ["element", "file", "module"].map(
        (boxName) => boxes.box(boxName).isOpen
      );

      // Assert
      expect(states).toEqual([true, true, false]);
    });

    it("should say that a box is expanded, and control the body that lists its properties", () => {
      // Arrange
      const element = renderBoxes().box("element");

      // Act
      const { isOpen, controlledId, bodyId } = element;

      // Assert
      expect(isOpen).toBe(true);
      expect(bodyId).not.toBeNull();
      expect(controlledId).toBe(bodyId);
    });

    it("should list no property of a box that is folded", () => {
      // Arrange
      const moduleBox = renderBoxes().box("module");

      // Act
      const { isOpen, hasBody } = moduleBox;

      // Assert
      expect(isOpen).toBe(false);
      expect(hasBody).toBe(false);
      expect(() => moduleBox.entries).toThrow("found no element");
    });

    it("should fold the box whose place in its own section is folded", () => {
      // Arrange
      const choices: InspectorChoices = { "from.element": false };
      const from = renderBoxes({ side: "from" }, choices);

      // Act
      const fromElement = from.box("element").isOpen;

      // Assert
      expect(fromElement).toBe(false);
    });

    it("should keep open the box of the other section, when only the place of its own section is folded", () => {
      // Arrange
      const choices: InspectorChoices = { "from.element": false };
      const to = renderBoxes({ side: "to" }, choices);

      // Act
      const toElement = to.box("element").isOpen;

      // Assert
      expect(toElement).toBe(true);
    });

    it("should call onToggle with the place of the box that was pressed, named after its section", () => {
      // Arrange
      const onToggle = jest.fn<void, [InspectorPlace]>();
      const boxes = renderBoxes({ side: "to", onToggle });

      // Act
      boxes.box("file").toggle();
      boxes.box("module").toggle();

      // Assert
      expect(onToggle.mock.calls).toEqual([["to.file"], ["to.module"]]);
    });
  });

  describe("the digest of a folded box", () => {
    it("should show the first property after the name of each folded box, in the muted color", () => {
      // Arrange
      const boxes = renderBoxes(
        {},
        { "from.element": false, "from.file": false }
      );

      // Act
      const digests = ["element", "file", "module"].map((boxName) => {
        const box = boxes.box(boxName);

        return [box.summary, box.summaryColor];
      });

      // Assert
      expect(digests).toEqual([
        ['[ "component" ]', "var(--jsb-muted)"],
        ['[ "test" ]', "var(--jsb-muted)"],
        ['"local"', "var(--jsb-muted)"],
      ]);
    });

    it("should show null for the digest of a box whose first property is null", () => {
      // Arrange
      const boxes = renderBoxes(
        { description: CHECKOUT },
        { "from.file": false }
      );

      // Act
      const { summary } = boxes.box("file");

      // Assert
      expect(summary).toBe("null");
    });

    it("should leave the digest out of a box that is open, which lists the property itself", () => {
      // Arrange
      const boxes = renderBoxes();

      // Act
      const { summary } = boxes.box("element");

      // Assert
      expect(summary).toBeNull();
    });

    it("should show it at the end of the header", () => {
      // Arrange
      const boxes = renderBoxes();

      // Act
      const { isSummaryAtEnd } = boxes.box("module");

      // Assert
      expect(isSummaryAtEnd).toBe(true);
    });
  });

  it("should take the test id it is given in place of its own", () => {
    // Arrange
    renderBoxes({ testId: "to-boxes" });

    // Act
    const boxes = new EntityBoxesPom({ testId: "to-boxes" });

    // Assert
    expect(boxes.isRendered).toBe(true);
    expect(new EntityBoxesPom().isRendered).toBe(false);
  });
});
