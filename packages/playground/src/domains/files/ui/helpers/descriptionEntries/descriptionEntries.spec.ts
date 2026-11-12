import type { DependencyDescription } from "@/domains/evaluation/helpers/engine";
import { createEntityDescription } from "@/domains/evaluation/helpers/engine/entityDescription.mock";

import {
  describeDependencyEntries,
  describeEntityBoxes,
} from "./descriptionEntries";

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

const DEPENDENCY: DependencyDescription["dependency"] = {
  kind: "type",
  nodeKind: "import",
  source: "../../components/atoms/Button/Button.spec.js",
  specifiers: ["renderButton", "ButtonProps"],
  relationship: { from: "uncle", to: "nephew" },
};

describe("descriptionEntries", () => {
  describe("describeEntityBoxes", () => {
    it("should give the element, the file and the module, in that order", () => {
      // Act
      const boxes = describeEntityBoxes(BUTTON_SPEC);

      // Assert
      expect(boxes.map(({ name: boxName }) => boxName)).toEqual([
        "element",
        "file",
        "module",
      ]);
    });

    it("should list every property of the element, in the order of the plugin", () => {
      // Act
      const [element] = describeEntityBoxes(BUTTON_SPEC);

      // Assert
      expect(element.entries).toEqual([
        { key: "types", value: ["component"] },
        { key: "path", value: "src/components/atoms/Button" },
        { key: "fileInternalPath", value: "Button.spec.js" },
        { key: "captured", value: { family: "atoms", name: "Button" } },
        {
          key: "parents",
          value: [
            {
              types: ["family"],
              path: "src/components/atoms",
              captured: { name: "atoms" },
            },
          ],
        },
        { key: "isIgnored", value: false },
        { key: "isUnknown", value: false },
      ]);
    });

    it("should list every property of the file, in the order of the plugin", () => {
      // Act
      const [, file] = describeEntityBoxes(BUTTON_SPEC);

      // Assert
      expect(file.entries).toEqual([
        { key: "categories", value: ["test"] },
        { key: "path", value: "src/components/atoms/Button/Button.spec.js" },
        { key: "captured", value: { name: "Button" } },
        { key: "isIgnored", value: false },
        { key: "isUnknown", value: false },
      ]);
    });

    it("should list every property of the module, in the order of the plugin", () => {
      // Arrange
      const reactJsx = createEntityDescription({
        module: {
          origin: "external",
          source: "react",
          internalPath: "jsx-runtime",
        },
      });

      // Act
      const [, , moduleBox] = describeEntityBoxes(reactJsx);

      // Assert
      expect(moduleBox.entries).toEqual([
        { key: "origin", value: "external" },
        { key: "source", value: "react" },
        { key: "internalPath", value: "jsx-runtime" },
      ]);
    });

    it("should keep the null of what no descriptor matches, and the empty parents of an element with none", () => {
      // Act
      const [element, file, moduleBox] = describeEntityBoxes(
        createEntityDescription()
      );

      // Assert
      expect(element.entries.map(({ value }) => value)).toEqual([
        null,
        null,
        null,
        null,
        [],
        false,
        true,
      ]);
      expect(file.entries.map(({ value }) => value)).toEqual([
        null,
        null,
        null,
        false,
        true,
      ]);
      expect(moduleBox.entries.map(({ value }) => value)).toEqual([
        "local",
        null,
        null,
      ]);
    });

    it("should leave out the selector shortcuts and the deprecated category, which are no property of a description", () => {
      // Act
      const keys = describeEntityBoxes(BUTTON_SPEC).flatMap(({ entries }) =>
        entries.map(({ key }) => key)
      );

      // Assert
      expect(keys).not.toContain("type");
      expect(keys).not.toContain("parent");
      expect(keys).not.toContain("category");
    });

    it("should give the first property of each box, formatted, as its digest", () => {
      // Act
      const digests = describeEntityBoxes(BUTTON_SPEC).map(
        ({ digest }) => digest
      );

      // Assert
      expect(digests).toEqual(['[ "component" ]', '[ "test" ]', '"local"']);
    });

    it("should give null as the digest of a box whose first property no descriptor gives", () => {
      // Act
      const digests = describeEntityBoxes(createEntityDescription()).map(
        ({ digest }) => digest
      );

      // Assert
      expect(digests).toEqual(["null", "null", '"local"']);
    });
  });

  describe("describeDependencyEntries", () => {
    it("should list kind, nodeKind, source, specifiers and relationship, in that order", () => {
      // Act
      const keys = describeDependencyEntries(DEPENDENCY).map(({ key }) => key);

      // Assert
      expect(keys).toEqual([
        "kind",
        "nodeKind",
        "source",
        "specifiers",
        "relationship",
        "from",
        "to",
      ]);
    });

    it("should give each property its value", () => {
      // Act
      const entries = describeDependencyEntries(DEPENDENCY);

      // Assert
      expect(entries.slice(0, 4)).toEqual([
        { key: "kind", value: "type" },
        { key: "nodeKind", value: "import" },
        {
          key: "source",
          value: "../../components/atoms/Button/Button.spec.js",
        },
        { key: "specifiers", value: ["renderButton", "ButtonProps"] },
      ]);
    });

    it("should leave the relationship without a value and nest its two sides under it", () => {
      // Act
      const entries = describeDependencyEntries(DEPENDENCY);

      // Assert
      expect(entries.slice(4)).toEqual([
        { key: "relationship" },
        { key: "from", value: "uncle", isNested: true },
        { key: "to", value: "nephew", isNested: true },
      ]);
    });

    it("should keep the null of a dependency that has no node kind, no specifiers and no relationship", () => {
      // Act
      const values = describeDependencyEntries({
        ...DEPENDENCY,
        nodeKind: null,
        specifiers: null,
        relationship: { from: null, to: null },
      }).map(({ value }) => value);

      // Assert
      expect(values).toEqual([
        "type",
        null,
        "../../components/atoms/Button/Button.spec.js",
        null,
        undefined,
        null,
        null,
      ]);
    });
  });
});
