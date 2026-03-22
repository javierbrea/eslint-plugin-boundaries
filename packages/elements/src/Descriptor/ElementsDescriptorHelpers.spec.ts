import type {
  ElementDescription,
  ExternalFileDescription,
  CoreFileDescription,
} from "./ElementsDescriptor.types";
import {
  isLocalElement,
  isExternalDependencyElement,
  isCoreDependencyElement,
  isLocalDependencyElement,
  isElementDescription,
  isElementDescriptorMode,
  isElementDescriptorPattern,
  isBaseElementDescriptor,
  isElementDescriptorWithType,
  isFileDescriptor,
  isFileDescription,
  isIgnoredElement,
  isKnownLocalElement,
  isUnknownLocalElement,
} from "./ElementsDescriptorHelpers";

describe("elementHelpers", () => {
  describe("isLocalElement", () => {
    it("should return true for known local elements", () => {
      const knownLocalElement: ElementDescription = {
        type: "component",
        captured: { name: "Button" },
        parents: [],
        path: "/src/components",
      };

      expect(isLocalElement(knownLocalElement)).toBe(true);
      expect(isKnownLocalElement(knownLocalElement)).toBe(true);
    });

    it("should return true for null elements as unknown local elements", () => {
      const unknownLocalElement = null;

      expect(isLocalElement(unknownLocalElement)).toBe(false);
      expect(isUnknownLocalElement(unknownLocalElement)).toBe(true);
    });

    it("should treat null as ignored element", () => {
      const ignoredElement = null;

      expect(isLocalElement(ignoredElement)).toBe(false);
      expect(isIgnoredElement(ignoredElement)).toBe(true);
    });

    it("should return false for non-element objects", () => {
      expect(isLocalElement({})).toBe(false);
      expect(isLocalElement({ path: "/foo" })).toBe(false);
      expect(isLocalElement(null)).toBe(false);
      expect(isLocalElement(undefined)).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(isLocalElement("string")).toBe(false);
      expect(isLocalElement(123)).toBe(false);
      expect(isLocalElement(true)).toBe(false);
    });
  });

  describe("isLocalDependencyElement", () => {
    it("should return true for local elements (isLocalDependencyElement is alias for isLocalElement)", () => {
      const localElement: ElementDescription = {
        type: "service",
        captured: null,
        parents: [
          {
            type: "module",
            path: "/src",
            captured: null,
          },
        ],
        path: "/src/services",
      };

      expect(isLocalDependencyElement(localElement)).toBe(true);
    });

    it("should return false for null elements", () => {
      const ignoredElement = null;

      expect(isLocalDependencyElement(ignoredElement)).toBe(false);
    });
  });

  describe("isExternalDependencyElement", () => {
    it("should return true for external file descriptions", () => {
      const externalFile: ExternalFileDescription = {
        path: "/node_modules/react",
        internalPath: null,
        category: null,
        captured: null,
        element: null,
        origin: "external",
        isIgnored: false,
        isUnknown: true,
      };

      expect(isFileDescription(externalFile)).toBe(true);
      expect(isExternalDependencyElement(externalFile)).toBe(true);
    });

    it("should return false for unknown local file descriptions", () => {
      const localUnknownFile = {
        path: "/src/utils",
        internalPath: null,
        category: null,
        captured: null,
        element: null,
        origin: "local",
        isIgnored: false,
        isUnknown: true,
      };

      expect(isFileDescription(localUnknownFile as unknown)).toBe(true);
      expect(isExternalDependencyElement(localUnknownFile as unknown)).toBe(
        false
      );
    });

    it("should return false for non-file-description objects", () => {
      expect(isExternalDependencyElement({})).toBe(false);
      expect(isExternalDependencyElement({ origin: "external" })).toBe(false);
      expect(isExternalDependencyElement(null)).toBe(false);
    });
  });

  describe("isCoreDependencyElement", () => {
    it("should return true for core file descriptions", () => {
      const coreFile: CoreFileDescription = {
        path: "/node_modules/node",
        internalPath: null,
        category: null,
        captured: null,
        element: null,
        origin: "core",
        isIgnored: false,
        isUnknown: true,
      };

      expect(isCoreDependencyElement(coreFile)).toBe(true);
    });

    it("should return false for external file descriptions", () => {
      const externalFile: ExternalFileDescription = {
        path: "/node_modules/react",
        internalPath: null,
        category: null,
        captured: null,
        element: null,
        origin: "external",
        isIgnored: false,
        isUnknown: true,
      };

      expect(isCoreDependencyElement(externalFile)).toBe(false);
    });
  });

  describe("isElementDescription", () => {
    it("should return true for ElementDescription", () => {
      const known: ElementDescription = {
        type: "service",
        captured: null,
        parents: [
          {
            type: "module",
            path: "/src",
            captured: null,
          },
        ],
        path: "/src/services",
      };

      expect(isElementDescription(known)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isElementDescription(null)).toBe(false);
    });

    it("should return false for non-ElementDescription objects", () => {
      expect(isElementDescription({})).toBe(false);
    });
  });

  describe("isElementDescriptorMode", () => {
    it("should return true for valid descriptor modes", () => {
      expect(isElementDescriptorMode("folder")).toBe(true);
      expect(isElementDescriptorMode("file")).toBe(true);
    });

    it("should return false for invalid modes", () => {
      expect(isElementDescriptorMode("invalid")).toBe(false);
      expect(isElementDescriptorMode(123)).toBe(false);
    });
  });

  describe("isElementDescriptorPattern", () => {
    it("should return true for string patterns", () => {
      expect(isElementDescriptorPattern("src/**")).toBe(true);
    });

    it("should return true for array of string patterns", () => {
      expect(isElementDescriptorPattern(["src/**", "lib/**"])).toBe(true);
    });

    it("should return false for empty arrays", () => {
      expect(isElementDescriptorPattern([])).toBe(false);
    });

    it("should return false for invalid patterns", () => {
      expect(isElementDescriptorPattern(123)).toBe(false);
    });
  });

  describe("isBaseElementDescriptor", () => {
    it("should return true for objects with pattern property", () => {
      expect(isBaseElementDescriptor({ pattern: "src/**" })).toBe(true);
      expect(isBaseElementDescriptor({ pattern: ["src/**"] })).toBe(true);
    });

    it("should return false for objects without pattern", () => {
      expect(isBaseElementDescriptor({})).toBe(false);
    });
  });

  describe("isElementDescriptorWithType", () => {
    it("should return true for element descriptors with type", () => {
      expect(
        isElementDescriptorWithType({
          pattern: "src/**",
          type: "component",
        })
      ).toBe(true);
    });

    it("should return false for descriptors without type", () => {
      expect(isElementDescriptorWithType({ pattern: "src/**" })).toBe(false);
    });
  });

  describe("isFileDescriptor", () => {
    it("should return true for file descriptors with category string", () => {
      expect(
        isFileDescriptor({
          pattern: "src/**",
          category: "test",
        })
      ).toBe(true);
    });

    it("should return true for file descriptors with category array", () => {
      expect(
        isFileDescriptor({
          pattern: "src/**",
          category: ["test", "unit"],
        })
      ).toBe(true);
    });

    it("should return false for descriptors without category", () => {
      expect(isFileDescriptor({ pattern: "src/**" })).toBe(false);
    });

    it("should return false for descriptors with empty category array", () => {
      expect(
        isFileDescriptor({
          pattern: "src/**",
          category: [],
        })
      ).toBe(false);
    });
  });
});
