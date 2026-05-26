import type { DescriptorOptionsNormalized } from "../../Config";
import type {
  ElementDescription,
  ElementParent,
  KnownElementDescription,
} from "../Element";
import type { EntitiesDescriptor, EntityDescription } from "../Entity";

import {
  DEPENDENCY_KINDS_MAP,
  DEPENDENCY_RELATIONSHIPS_MAP,
} from "./DependencyDescription.types";
import { DependenciesDescriptor } from "./DependencyDescriptor";

function createConfig(
  overrides?: Partial<DescriptorOptionsNormalized>
): DescriptorOptionsNormalized {
  return {
    cache: true,
    rootPath: "/root/project/",
    flagAsExternal: {
      unresolvableAlias: true,
      inNodeModules: true,
      outsideRootPath: false,
      customSourcePatterns: [],
    },
    ...overrides,
  };
}

function createParent(overrides?: Partial<ElementParent>): ElementParent {
  return {
    types: ["component"],
    category: "component",
    path: "/root/project/src/components",
    captured: null,
    ...overrides,
  };
}

function createKnownElement(
  overrides?: Partial<KnownElementDescription>
): KnownElementDescription {
  return {
    path: "/root/project/src/components/Foo",
    captured: { name: "Foo" },
    isIgnored: false,
    isUnknown: false,
    types: ["component"],
    category: "component",
    filePath: "/root/project/src/components/Foo/index.ts",
    fileInternalPath: "index.ts",
    parents: [],
    ...overrides,
  };
}

function createIgnoredElement(): ElementDescription {
  return {
    path: null,
    captured: null,
    isIgnored: true,
    isUnknown: true,
    types: null,
    category: null,
    filePath: null,
    fileInternalPath: null,
    parents: [],
  };
}

function createUnknownElement(): ElementDescription {
  return {
    path: null,
    captured: null,
    isIgnored: false,
    isUnknown: true,
    types: null,
    category: null,
    filePath: null,
    fileInternalPath: null,
    parents: [],
  };
}

function createEntityDescription(
  elementOverrides?: Partial<KnownElementDescription>
): EntityDescription {
  return {
    element: createKnownElement(elementOverrides),
    file: {
      path: null,
      captured: null,
      isIgnored: false,
      isUnknown: true,
      categories: null,
    },
    module: {
      origin: "local",
      source: null,
      internalPath: null,
    },
  };
}

function createEntitiesDescriptorMock(
  overrides?: Partial<EntitiesDescriptor>
): EntitiesDescriptor {
  return {
    describeEntity: jest.fn().mockReturnValue(createEntityDescription()),
    serializeCache: jest.fn().mockReturnValue({ descriptions: {} }),
    setCacheFromSerialized: jest.fn(),
    clearCache: jest.fn(),
    ...overrides,
  } as unknown as EntitiesDescriptor;
}

describe("DependenciesDescriptor", () => {
  describe("constructor", () => {
    it("should create an instance with cache enabled", () => {
      const config = createConfig({ cache: true });
      const entitiesDescriptor = createEntitiesDescriptorMock();

      const descriptor = new DependenciesDescriptor(entitiesDescriptor, config);

      expect(descriptor).toBeInstanceOf(DependenciesDescriptor);
    });

    it("should create an instance with cache disabled", () => {
      const config = createConfig({ cache: false });
      const entitiesDescriptor = createEntitiesDescriptorMock();

      const descriptor = new DependenciesDescriptor(entitiesDescriptor, config);

      expect(descriptor).toBeInstanceOf(DependenciesDescriptor);
    });
  });

  describe("describeDependency", () => {
    describe("dependency info", () => {
      it("should include source, kind, nodeKind and specifiers in the result", () => {
        const fromEntity = createEntityDescription({ path: "/A" });
        const toEntity = createEntityDescription({ path: "/B" });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A",
          to: "/B",
          source: "./B",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
          nodeKind: "ImportDeclaration",
          specifiers: ["default"],
        });

        expect(result.dependency.source).toBe("./B");
        expect(result.dependency.kind).toBe(DEPENDENCY_KINDS_MAP.VALUE);
        expect(result.dependency.nodeKind).toBe("ImportDeclaration");
        expect(result.dependency.specifiers).toEqual(["default"]);
      });

      it("should default nodeKind to null when not provided", () => {
        const fromEntity = createEntityDescription({ path: "/A" });
        const toEntity = createEntityDescription({ path: "/B" });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A",
          to: "/B",
          source: "./B",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.nodeKind).toBeNull();
      });

      it("should default specifiers to null when not provided", () => {
        const fromEntity = createEntityDescription({ path: "/A" });
        const toEntity = createEntityDescription({ path: "/B" });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A",
          to: "/B",
          source: "./B",
          kind: DEPENDENCY_KINDS_MAP.TYPE,
        });

        expect(result.dependency.specifiers).toBeNull();
      });

      it("should return from and to entity descriptions", () => {
        const fromEntity = createEntityDescription({ path: "/A" });
        const toEntity = createEntityDescription({ path: "/B" });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A",
          to: "/B",
          source: "./B",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.from).toBe(fromEntity);
        expect(result.to).toBe(toEntity);
      });

      it("should call describeEntity with from path and to path with source", () => {
        const entitiesDescriptor = createEntitiesDescriptorMock();
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        descriptor.describeDependency({
          from: "/path/from",
          to: "/path/to",
          source: "module-source",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(entitiesDescriptor.describeEntity).toHaveBeenCalledWith(
          "/path/from"
        );
        expect(entitiesDescriptor.describeEntity).toHaveBeenCalledWith(
          "/path/to",
          "module-source"
        );
      });
    });

    describe("relationships", () => {
      it("should return null relationships when to element is ignored", () => {
        const fromEntity = createEntityDescription({ path: "/A" });
        const toEntity: EntityDescription = {
          ...createEntityDescription(),
          element: createIgnoredElement(),
        };
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A",
          to: "/B",
          source: "./B",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: null,
          to: null,
        });
      });

      it("should return null relationships when to element is unknown", () => {
        const fromEntity = createEntityDescription({ path: "/A" });
        const toEntity: EntityDescription = {
          ...createEntityDescription(),
          element: createUnknownElement(),
        };
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A",
          to: "/B",
          source: "./B",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: null,
          to: null,
        });
      });

      it("should return null relationships when from element is unknown", () => {
        const fromEntity: EntityDescription = {
          ...createEntityDescription(),
          element: createUnknownElement(),
        };
        const toEntity = createEntityDescription({ path: "/B" });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A",
          to: "/B",
          source: "./B",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: null,
          to: null,
        });
      });

      it("should return internal relationship when both elements have the same path", () => {
        const fromEntity = createEntityDescription({ path: "/A" });
        const toEntity = createEntityDescription({ path: "/A" });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A",
          to: "/A/index.ts",
          source: "./index",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
          to: DEPENDENCY_RELATIONSHIPS_MAP.INTERNAL,
        });
      });

      it("should return child/parent relationship when to is a child of from", () => {
        const fromEntity = createEntityDescription({
          path: "/A",
          parents: [],
        });
        const toEntity = createEntityDescription({
          path: "/A/B",
          parents: [createParent({ path: "/A" })],
        });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A",
          to: "/A/B",
          source: "./B",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: DEPENDENCY_RELATIONSHIPS_MAP.PARENT,
          to: DEPENDENCY_RELATIONSHIPS_MAP.CHILD,
        });
      });

      it("should return parent/child relationship when from is a child of to", () => {
        const fromEntity = createEntityDescription({
          path: "/A/B",
          parents: [createParent({ path: "/A" })],
        });
        const toEntity = createEntityDescription({
          path: "/A",
          parents: [],
        });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A/B",
          to: "/A",
          source: "..",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: DEPENDENCY_RELATIONSHIPS_MAP.CHILD,
          to: DEPENDENCY_RELATIONSHIPS_MAP.PARENT,
        });
      });

      it("should return descendant/ancestor relationship when to is a non-direct descendant of from", () => {
        const fromEntity = createEntityDescription({
          path: "/A",
          parents: [],
        });
        const toEntity = createEntityDescription({
          path: "/A/B/C",
          parents: [
            createParent({ path: "/A/B" }),
            createParent({ path: "/A" }),
          ],
        });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A",
          to: "/A/B/C",
          source: "./B/C",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: DEPENDENCY_RELATIONSHIPS_MAP.ANCESTOR,
          to: DEPENDENCY_RELATIONSHIPS_MAP.DESCENDANT,
        });
      });

      it("should return ancestor/descendant relationship when from is a non-direct descendant of to", () => {
        const fromEntity = createEntityDescription({
          path: "/A/B/C",
          parents: [
            createParent({ path: "/A/B" }),
            createParent({ path: "/A" }),
          ],
        });
        const toEntity = createEntityDescription({
          path: "/A",
          parents: [],
        });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A/B/C",
          to: "/A",
          source: "../../",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: DEPENDENCY_RELATIONSHIPS_MAP.DESCENDANT,
          to: DEPENDENCY_RELATIONSHIPS_MAP.ANCESTOR,
        });
      });

      it("should return sibling relationship when both elements share the same parent", () => {
        const sharedParent = createParent({ path: "/A" });
        const fromEntity = createEntityDescription({
          path: "/A/X",
          parents: [sharedParent],
        });
        const toEntity = createEntityDescription({
          path: "/A/Y",
          parents: [sharedParent],
        });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A/X",
          to: "/A/Y",
          source: "../Y",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: DEPENDENCY_RELATIONSHIPS_MAP.SIBLING,
          to: DEPENDENCY_RELATIONSHIPS_MAP.SIBLING,
        });
      });

      it("should return uncle/nephew relationship when to's parent is an ancestor of from", () => {
        const fromEntity = createEntityDescription({
          path: "/A/X/Z",
          parents: [
            createParent({ path: "/A/X" }),
            createParent({ path: "/A" }),
          ],
        });
        const toEntity = createEntityDescription({
          path: "/A/Y",
          parents: [createParent({ path: "/A" })],
        });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A/X/Z",
          to: "/A/Y",
          source: "../../Y",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: DEPENDENCY_RELATIONSHIPS_MAP.NEPHEW,
          to: DEPENDENCY_RELATIONSHIPS_MAP.UNCLE,
        });
      });

      it("should return nephew/uncle relationship when from's parent is an ancestor of to", () => {
        const fromEntity = createEntityDescription({
          path: "/A/Y",
          parents: [createParent({ path: "/A" })],
        });
        const toEntity = createEntityDescription({
          path: "/A/X/Z",
          parents: [
            createParent({ path: "/A/X" }),
            createParent({ path: "/A" }),
          ],
        });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/A/Y",
          to: "/A/X/Z",
          source: "../X/Z",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: DEPENDENCY_RELATIONSHIPS_MAP.UNCLE,
          to: DEPENDENCY_RELATIONSHIPS_MAP.NEPHEW,
        });
      });

      it("should return null relationships when elements have no hierarchical relationship", () => {
        const fromEntity = createEntityDescription({
          path: "/X",
          parents: [],
        });
        const toEntity = createEntityDescription({
          path: "/Y",
          parents: [],
        });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );

        const result = descriptor.describeDependency({
          from: "/X",
          to: "/Y",
          source: "../Y",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        });

        expect(result.dependency.relationship).toEqual({
          from: null,
          to: null,
        });
      });
    });

    describe("caching", () => {
      it("should return the cached result on the second call with the same arguments", () => {
        const fromEntity = createEntityDescription({ path: "/A" });
        const toEntity = createEntityDescription({ path: "/B" });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity)
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig()
        );
        const options = {
          from: "/A",
          to: "/B",
          source: "./B",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        };

        const first = descriptor.describeDependency(options);
        const second = descriptor.describeDependency(options);

        expect(first).toBe(second);
        expect(entitiesDescriptor.describeEntity).toHaveBeenCalledTimes(2);
      });

      it("should not use cache when cache is disabled", () => {
        const fromEntity = createEntityDescription({ path: "/A" });
        const toEntity = createEntityDescription({ path: "/B" });
        const entitiesDescriptor = createEntitiesDescriptorMock({
          describeEntity: jest
            .fn()
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity)
            .mockReturnValueOnce(fromEntity)
            .mockReturnValueOnce(toEntity),
        });
        const descriptor = new DependenciesDescriptor(
          entitiesDescriptor,
          createConfig({ cache: false })
        );
        const options = {
          from: "/A",
          to: "/B",
          source: "./B",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
        };

        const first = descriptor.describeDependency(options);
        const second = descriptor.describeDependency(options);

        expect(first).not.toBe(second);
        expect(entitiesDescriptor.describeEntity).toHaveBeenCalledTimes(4);
      });
    });
  });

  describe("serializeCache", () => {
    it("should return serialized cache with described dependencies", () => {
      const fromEntity = createEntityDescription({ path: "/A" });
      const toEntity = createEntityDescription({ path: "/B" });
      const entitiesDescriptor = createEntitiesDescriptorMock({
        describeEntity: jest
          .fn()
          .mockReturnValueOnce(fromEntity)
          .mockReturnValueOnce(toEntity),
      });
      const descriptor = new DependenciesDescriptor(
        entitiesDescriptor,
        createConfig()
      );

      descriptor.describeDependency({
        from: "/A",
        to: "/B",
        source: "./B",
        kind: DEPENDENCY_KINDS_MAP.VALUE,
      });

      const serialized = descriptor.serializeCache();

      expect(Object.keys(serialized)).toContain("/A|/B|./B|value|undefined|");
    });

    it("should return empty object when no dependencies have been described", () => {
      const entitiesDescriptor = createEntitiesDescriptorMock();
      const descriptor = new DependenciesDescriptor(
        entitiesDescriptor,
        createConfig()
      );

      const serialized = descriptor.serializeCache();

      expect(serialized).toEqual({});
    });
  });

  describe("setCacheFromSerialized", () => {
    it("should restore cache from serialized data", () => {
      const fromEntity = createEntityDescription({ path: "/A" });
      const toEntity = createEntityDescription({ path: "/B" });
      const cachedResult = {
        from: fromEntity,
        to: toEntity,
        dependency: {
          source: "./B",
          kind: DEPENDENCY_KINDS_MAP.VALUE,
          nodeKind: null,
          specifiers: null,
          relationship: { from: null, to: null },
        },
      };
      const entitiesDescriptor = createEntitiesDescriptorMock();
      const descriptor = new DependenciesDescriptor(
        entitiesDescriptor,
        createConfig()
      );

      descriptor.setCacheFromSerialized({
        "/A|/B|./B|value|undefined|": cachedResult,
      });

      const result = descriptor.describeDependency({
        from: "/A",
        to: "/B",
        source: "./B",
        kind: DEPENDENCY_KINDS_MAP.VALUE,
      });

      expect(result).toEqual(cachedResult);
      expect(entitiesDescriptor.describeEntity).not.toHaveBeenCalled();
    });
  });

  describe("clearCache", () => {
    it("should clear all cached descriptions", () => {
      const fromEntity = createEntityDescription({ path: "/A" });
      const toEntity = createEntityDescription({ path: "/B" });
      const entitiesDescriptor = createEntitiesDescriptorMock({
        describeEntity: jest
          .fn()
          .mockReturnValueOnce(fromEntity)
          .mockReturnValueOnce(toEntity)
          .mockReturnValueOnce(fromEntity)
          .mockReturnValueOnce(toEntity),
      });
      const descriptor = new DependenciesDescriptor(
        entitiesDescriptor,
        createConfig()
      );
      const options = {
        from: "/A",
        to: "/B",
        source: "./B",
        kind: DEPENDENCY_KINDS_MAP.VALUE,
      };

      descriptor.describeDependency(options);
      descriptor.clearCache();
      descriptor.describeDependency(options);

      expect(entitiesDescriptor.describeEntity).toHaveBeenCalledTimes(4);
    });

    it("should result in empty serialized cache", () => {
      const fromEntity = createEntityDescription({ path: "/A" });
      const toEntity = createEntityDescription({ path: "/B" });
      const entitiesDescriptor = createEntitiesDescriptorMock({
        describeEntity: jest
          .fn()
          .mockReturnValueOnce(fromEntity)
          .mockReturnValueOnce(toEntity),
      });
      const descriptor = new DependenciesDescriptor(
        entitiesDescriptor,
        createConfig()
      );

      descriptor.describeDependency({
        from: "/A",
        to: "/B",
        source: "./B",
        kind: DEPENDENCY_KINDS_MAP.VALUE,
      });
      descriptor.clearCache();

      const serialized = descriptor.serializeCache();

      expect(serialized).toEqual({});
    });
  });
});
