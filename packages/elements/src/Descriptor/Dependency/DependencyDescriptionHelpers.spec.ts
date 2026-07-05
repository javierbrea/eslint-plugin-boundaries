import {
  DEPENDENCY_KINDS_MAP,
  DEPENDENCY_RELATIONSHIPS_MAP,
} from "./DependencyDescription.types";
import type {
  DependencyDescription,
  DependencyInfoDescription,
  DependencyRelationship,
} from "./DependencyDescription.types";
import {
  isDependencyKind,
  isDependencyRelationship,
  isDependencyRelationshipDescription,
  isDependencyInfo,
  isDependencyDescription,
  isDependencyWithInternalRelationship,
} from "./DependencyDescriptionHelpers";

function createValidRelationship(
  overrides?: Partial<DependencyRelationship>
): DependencyRelationship {
  return {
    from: DEPENDENCY_RELATIONSHIPS_MAP.PARENT,
    to: DEPENDENCY_RELATIONSHIPS_MAP.CHILD,
    ...overrides,
  };
}

function createValidDependencyInfo(
  overrides?: Partial<DependencyInfoDescription>
): DependencyInfoDescription {
  return {
    source: "./module",
    kind: DEPENDENCY_KINDS_MAP.VALUE,
    nodeKind: "ImportDeclaration",
    specifiers: ["foo"],
    relationship: createValidRelationship(),
    ...overrides,
  };
}

function createValidEntityDescription() {
  return {
    element: {
      path: "src/components/Foo.ts",
      captured: {},
      isIgnored: false,
      isUnknown: false,
      types: ["component"],
      parents: [],
    },
    file: {
      path: "src/components/Foo.ts",
      captured: {},
      isIgnored: false,
      isUnknown: false,
      categories: [],
    },
    module: null,
  };
}

function createValidDependencyDescription(
  overrides?: Partial<DependencyDescription>
): DependencyDescription {
  return {
    from: createValidEntityDescription(),
    to: createValidEntityDescription(),
    dependency: createValidDependencyInfo(),
    ...overrides,
  } as DependencyDescription;
}

describe("DependencyDescriptionHelpers", () => {
  describe("isDependencyKind", () => {
    it("should return true for 'type' kind", () => {
      expect(isDependencyKind(DEPENDENCY_KINDS_MAP.TYPE)).toBe(true);
    });

    it("should return true for 'value' kind", () => {
      expect(isDependencyKind(DEPENDENCY_KINDS_MAP.VALUE)).toBe(true);
    });

    it("should return true for 'typeof' kind", () => {
      expect(isDependencyKind(DEPENDENCY_KINDS_MAP.TYPE_OF)).toBe(true);
    });

    it("should return false for an unknown string", () => {
      expect(isDependencyKind("unknown")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isDependencyKind(123)).toBe(false);
      expect(isDependencyKind(null)).toBe(false);
      expect(isDependencyKind(undefined)).toBe(false);
      expect(isDependencyKind({})).toBe(false);

      expect(isDependencyKind([])).toBe(false);
    });
  });

  describe("isDependencyRelationship", () => {
    it.each(Object.values(DEPENDENCY_RELATIONSHIPS_MAP))(
      "should return true for '%s' relationship",
      (relationship) => {
        expect(isDependencyRelationship(relationship)).toBe(true);
      }
    );

    it("should return false for an unknown string", () => {
      expect(isDependencyRelationship("unknown")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isDependencyRelationship(123)).toBe(false);
      expect(isDependencyRelationship(null)).toBe(false);
      expect(isDependencyRelationship(undefined)).toBe(false);
      expect(isDependencyRelationship({})).toBe(false);

      expect(isDependencyRelationship([])).toBe(false);
    });
  });

  describe("isDependencyRelationshipDescription", () => {
    it("should return true for a valid relationship description with non-null values", () => {
      // Arrange
      const value = {
        from: DEPENDENCY_RELATIONSHIPS_MAP.PARENT,
        to: DEPENDENCY_RELATIONSHIPS_MAP.CHILD,
      };

      // Act & Assert
      expect(isDependencyRelationshipDescription(value)).toBe(true);
    });

    it("should return true when 'to' is null", () => {
      // Arrange
      const value = { from: DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL, to: null };

      // Act & Assert
      expect(isDependencyRelationshipDescription(value)).toBe(true);
    });

    it("should return true when 'from' is null", () => {
      // Arrange
      const value = { from: null, to: DEPENDENCY_RELATIONSHIPS_MAP.SIBLING };

      // Act & Assert
      expect(isDependencyRelationshipDescription(value)).toBe(true);
    });

    it("should return true when both 'from' and 'to' are null", () => {
      // Arrange
      const value = { from: null, to: null };

      // Act & Assert
      expect(isDependencyRelationshipDescription(value)).toBe(true);
    });

    it("should return false when 'to' is an invalid string", () => {
      // Arrange
      const value = {
        from: DEPENDENCY_RELATIONSHIPS_MAP.PARENT,
        to: "invalid",
      };

      // Act & Assert
      expect(isDependencyRelationshipDescription(value)).toBe(false);
    });

    it("should return false when 'from' is an invalid string", () => {
      // Arrange
      const value = { from: "invalid", to: DEPENDENCY_RELATIONSHIPS_MAP.CHILD };

      // Act & Assert
      expect(isDependencyRelationshipDescription(value)).toBe(false);
    });

    it("should return false when 'to' property is missing", () => {
      // Arrange
      const value = { from: DEPENDENCY_RELATIONSHIPS_MAP.PARENT };

      // Act & Assert
      expect(isDependencyRelationshipDescription(value)).toBe(false);
    });

    it("should return false when 'from' property is missing", () => {
      // Arrange
      const value = { to: DEPENDENCY_RELATIONSHIPS_MAP.CHILD };

      // Act & Assert
      expect(isDependencyRelationshipDescription(value)).toBe(false);
    });

    it("should return false for non-object values", () => {
      expect(isDependencyRelationshipDescription("string")).toBe(false);
      expect(isDependencyRelationshipDescription(123)).toBe(false);
      expect(isDependencyRelationshipDescription(null)).toBe(false);
      expect(isDependencyRelationshipDescription(undefined)).toBe(false);

      expect(isDependencyRelationshipDescription([])).toBe(false);
    });
  });

  describe("isDependencyInfo", () => {
    it("should return true for a valid dependency info", () => {
      // Arrange
      const value = createValidDependencyInfo();

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(true);
    });

    it("should return true when nodeKind is null", () => {
      // Arrange
      const value = createValidDependencyInfo({ nodeKind: null });

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(true);
    });

    it("should return true when specifiers is null", () => {
      // Arrange
      const value = createValidDependencyInfo({ specifiers: null });

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(true);
    });

    it("should return true when both nodeKind and specifiers are null", () => {
      // Arrange
      const value = createValidDependencyInfo({
        nodeKind: null,
        specifiers: null,
      });

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(true);
    });

    it("should return false when source is not a string", () => {
      // Arrange
      const value = { ...createValidDependencyInfo(), source: 123 };

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(false);
    });

    it("should return false when source is missing", () => {
      // Arrange
      const { source: _source, ...value } = createValidDependencyInfo();

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(false);
    });

    it("should return false when kind is invalid", () => {
      // Arrange
      const value = { ...createValidDependencyInfo(), kind: "invalid" };

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(false);
    });

    it("should return false when kind is missing", () => {
      // Arrange
      const { kind: _kind, ...value } = createValidDependencyInfo();

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(false);
    });

    it("should return false when relationship is invalid", () => {
      // Arrange
      const value = {
        ...createValidDependencyInfo(),
        relationship: { from: "invalid", to: "invalid" },
      };

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(false);
    });

    it("should return false when relationship is missing", () => {
      // Arrange
      const { relationship: _relationship, ...value } =
        createValidDependencyInfo();

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(false);
    });

    it("should return false when nodeKind is a non-string, non-null value", () => {
      // Arrange
      const value = { ...createValidDependencyInfo(), nodeKind: 123 };

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(false);
    });

    it("should return false when nodeKind is missing", () => {
      // Arrange
      const { nodeKind: _nodeKind, ...value } = createValidDependencyInfo();

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(false);
    });

    it("should return false when specifiers is a non-array, non-null value", () => {
      // Arrange
      const value = { ...createValidDependencyInfo(), specifiers: "foo" };

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(false);
    });

    it("should return false when specifiers is missing", () => {
      // Arrange
      const { specifiers: _specifiers, ...value } = createValidDependencyInfo();

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(false);
    });

    it("should return false when specifiers contains non-string elements", () => {
      // Arrange
      const value = { ...createValidDependencyInfo(), specifiers: [1, 2] };

      // Act & Assert
      expect(isDependencyInfo(value)).toBe(false);
    });

    it("should return false for non-object values", () => {
      expect(isDependencyInfo("string")).toBe(false);
      expect(isDependencyInfo(null)).toBe(false);
      expect(isDependencyInfo(undefined)).toBe(false);
    });
  });

  describe("isDependencyDescription", () => {
    it("should return true for a valid dependency description", () => {
      // Arrange
      const value = createValidDependencyDescription();

      // Act & Assert
      expect(isDependencyDescription(value)).toBe(true);
    });

    it("should return false when 'to' is not a valid entity description", () => {
      // Arrange
      const value = { ...createValidDependencyDescription(), to: "invalid" };

      // Act & Assert
      expect(isDependencyDescription(value)).toBe(false);
    });

    it("should return false when 'to' is missing", () => {
      // Arrange
      const { to: _to, ...value } = createValidDependencyDescription();

      // Act & Assert
      expect(isDependencyDescription(value)).toBe(false);
    });

    it("should return false when 'from' is not a valid entity description", () => {
      // Arrange
      const value = { ...createValidDependencyDescription(), from: "invalid" };

      // Act & Assert
      expect(isDependencyDescription(value)).toBe(false);
    });

    it("should return false when 'from' is missing", () => {
      // Arrange
      const { from: _from, ...value } = createValidDependencyDescription();

      // Act & Assert
      expect(isDependencyDescription(value)).toBe(false);
    });

    it("should return false when 'dependency' is not a valid dependency info", () => {
      // Arrange
      const value = {
        ...createValidDependencyDescription(),
        dependency: "invalid",
      };

      // Act & Assert
      expect(isDependencyDescription(value)).toBe(false);
    });

    it("should return false when 'dependency' is missing", () => {
      // Arrange
      const { dependency: _dependency, ...value } =
        createValidDependencyDescription();

      // Act & Assert
      expect(isDependencyDescription(value)).toBe(false);
    });

    it("should return false for non-object values", () => {
      expect(isDependencyDescription("string")).toBe(false);
      expect(isDependencyDescription(null)).toBe(false);
      expect(isDependencyDescription(undefined)).toBe(false);
    });
  });

  describe("isDependencyWithInternalRelationship", () => {
    it("should return true when the dependency relationship 'to' is internal", () => {
      // Arrange
      const dependency = createValidDependencyDescription({
        dependency: createValidDependencyInfo({
          relationship: createValidRelationship({
            to: DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
          }),
        }),
      });

      // Act
      const result = isDependencyWithInternalRelationship(dependency);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when the dependency relationship 'to' is not internal", () => {
      // Arrange
      const dependency = createValidDependencyDescription({
        dependency: createValidDependencyInfo({
          relationship: createValidRelationship({
            to: DEPENDENCY_RELATIONSHIPS_MAP.CHILD,
          }),
        }),
      });

      // Act
      const result = isDependencyWithInternalRelationship(dependency);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false when the dependency relationship 'to' is null", () => {
      // Arrange
      const dependency = createValidDependencyDescription({
        dependency: createValidDependencyInfo({
          relationship: createValidRelationship({ to: null }),
        }),
      });

      // Act
      const result = isDependencyWithInternalRelationship(dependency);

      // Assert
      expect(result).toBe(false);
    });
  });
});
