import type { DescriptorOptionsNormalized } from "../../Config";
import type { ElementDescription } from "../Element";
import type { FileDescription } from "../File";
import type { ModuleDescription } from "../Module";

import type { EntityDescription } from "./EntityDescription.types";
import { EntitiesDescriptor } from "./EntityDescriptor";

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

function createElementDescription(
  overrides?: Partial<ElementDescription>
): ElementDescription {
  return {
    path: "src/components/Foo.ts",
    captured: { name: "Foo" },
    isIgnored: false,
    isUnknown: false,
    types: ["component"],
    category: "component",
    filePath: "src/components/Foo.ts",
    fileInternalPath: "Foo.ts",
    parents: [],
    ...overrides,
  };
}

function createFileDescription(
  overrides?: Partial<FileDescription>
): FileDescription {
  return {
    path: "src/components/Foo.ts",
    captured: { name: "Foo" },
    isIgnored: false,
    isUnknown: false,
    categories: ["component"],
    ...overrides,
  };
}

function createModuleDescription(
  overrides?: Partial<ModuleDescription>
): ModuleDescription {
  return {
    origin: "local",
    source: null,
    internalPath: null,
    ...overrides,
  };
}

interface ElementsDescriptorMock {
  describeElement: jest.Mock;
}

interface FilesDescriptorMock {
  describeFile: jest.Mock;
}

interface ModulesDescriptorMock {
  describeModule: jest.Mock;
}

interface DescriptorMocks {
  elementsDescriptor: ElementsDescriptorMock;
  filesDescriptor: FilesDescriptorMock;
  modulesDescriptor: ModulesDescriptorMock;
}

function createDescriptorMocks(
  overrides?: Partial<{
    elementDescription: ElementDescription;
    fileDescription: FileDescription;
    moduleDescription: ModuleDescription;
  }>
): DescriptorMocks {
  return {
    elementsDescriptor: {
      describeElement: jest
        .fn()
        .mockReturnValue(
          overrides?.elementDescription ?? createElementDescription()
        ),
    },
    filesDescriptor: {
      describeFile: jest
        .fn()
        .mockReturnValue(overrides?.fileDescription ?? createFileDescription()),
    },
    modulesDescriptor: {
      describeModule: jest
        .fn()
        .mockReturnValue(
          overrides?.moduleDescription ?? createModuleDescription()
        ),
    },
  };
}

function createEntitiesDescriptor(
  mocks: DescriptorMocks,
  configOverrides?: Partial<DescriptorOptionsNormalized>
): EntitiesDescriptor {
  const config = createConfig(configOverrides);
  return new EntitiesDescriptor(
    // @ts-expect-error Mocked partially
    mocks.elementsDescriptor,
    mocks.filesDescriptor,
    mocks.modulesDescriptor,
    config
  );
}

describe("EntitiesDescriptor", () => {
  describe("constructor", () => {
    it("should create an instance with cache enabled", () => {
      const mocks = createDescriptorMocks();

      const descriptor = createEntitiesDescriptor(mocks, { cache: true });

      expect(descriptor).toBeInstanceOf(EntitiesDescriptor);
    });

    it("should create an instance with cache disabled", () => {
      const mocks = createDescriptorMocks();

      const descriptor = createEntitiesDescriptor(mocks, { cache: false });

      expect(descriptor).toBeInstanceOf(EntitiesDescriptor);
    });
  });

  describe("describeEntity", () => {
    it("should delegate to element, file, and module descriptors", () => {
      const mocks = createDescriptorMocks();
      const descriptor = createEntitiesDescriptor(mocks);

      descriptor.describeEntity("/root/project/src/file.ts", "./file");

      expect(mocks.elementsDescriptor.describeElement).toHaveBeenCalledWith(
        "/root/project/src/file.ts"
      );
      expect(mocks.filesDescriptor.describeFile).toHaveBeenCalledWith(
        "/root/project/src/file.ts"
      );
      expect(mocks.modulesDescriptor.describeModule).toHaveBeenCalledWith(
        "/root/project/src/file.ts",
        "./file"
      );
    });

    it("should return an entity description with element, file, and module", () => {
      const elementDescription = createElementDescription({
        types: ["service"],
      });
      const fileDescription = createFileDescription({
        categories: ["source"],
      });
      const moduleDescription = createModuleDescription({
        origin: "external",
        source: "lodash",
      });
      const mocks = createDescriptorMocks({
        elementDescription,
        fileDescription,
        moduleDescription,
      });
      const descriptor = createEntitiesDescriptor(mocks);

      const result = descriptor.describeEntity(
        "/root/project/src/file.ts",
        "lodash"
      );

      expect(result).toEqual({
        element: elementDescription,
        file: fileDescription,
        module: moduleDescription,
      });
    });

    it("should handle undefined filePath", () => {
      const mocks = createDescriptorMocks();
      const descriptor = createEntitiesDescriptor(mocks);

      descriptor.describeEntity(undefined, "lodash");

      expect(mocks.elementsDescriptor.describeElement).toHaveBeenCalledWith(
        undefined
      );
      expect(mocks.filesDescriptor.describeFile).toHaveBeenCalledWith(
        undefined
      );
      expect(mocks.modulesDescriptor.describeModule).toHaveBeenCalledWith(
        undefined,
        "lodash"
      );
    });

    it("should handle undefined source", () => {
      const mocks = createDescriptorMocks();
      const descriptor = createEntitiesDescriptor(mocks);

      descriptor.describeEntity("/root/project/src/file.ts");

      expect(mocks.modulesDescriptor.describeModule).toHaveBeenCalledWith(
        "/root/project/src/file.ts",
        undefined
      );
    });

    it("should handle both filePath and source as undefined", () => {
      const mocks = createDescriptorMocks();
      const descriptor = createEntitiesDescriptor(mocks);

      descriptor.describeEntity();

      expect(mocks.elementsDescriptor.describeElement).toHaveBeenCalledWith(
        undefined
      );
      expect(mocks.filesDescriptor.describeFile).toHaveBeenCalledWith(
        undefined
      );
      expect(mocks.modulesDescriptor.describeModule).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });

    describe("caching", () => {
      it("should return the cached result on the second call with the same arguments", () => {
        const mocks = createDescriptorMocks();
        const descriptor = createEntitiesDescriptor(mocks);

        const first = descriptor.describeEntity(
          "/root/project/src/file.ts",
          "./file"
        );
        const second = descriptor.describeEntity(
          "/root/project/src/file.ts",
          "./file"
        );

        expect(first).toBe(second);
        expect(mocks.elementsDescriptor.describeElement).toHaveBeenCalledTimes(
          1
        );
      });

      it("should return different results for different filePath arguments", () => {
        const elementA = createElementDescription({ types: ["component"] });
        const elementB = createElementDescription({ types: ["service"] });
        const mocks = createDescriptorMocks();
        mocks.elementsDescriptor.describeElement
          .mockReturnValueOnce(elementA)
          .mockReturnValueOnce(elementB);
        const descriptor = createEntitiesDescriptor(mocks);

        const resultA = descriptor.describeEntity("/root/project/src/a.ts");
        const resultB = descriptor.describeEntity("/root/project/src/b.ts");

        expect(resultA.element).toBe(elementA);
        expect(resultB.element).toBe(elementB);
      });

      it("should return different results for same filePath but different source", () => {
        const mocks = createDescriptorMocks();
        const descriptor = createEntitiesDescriptor(mocks);

        const first = descriptor.describeEntity(
          "/root/project/src/file.ts",
          "./file"
        );
        const second = descriptor.describeEntity(
          "/root/project/src/file.ts",
          "lodash"
        );

        expect(first).not.toBe(second);
        expect(mocks.elementsDescriptor.describeElement).toHaveBeenCalledTimes(
          2
        );
      });

      it("should not call sub-descriptors when result is cached", () => {
        const mocks = createDescriptorMocks();
        const descriptor = createEntitiesDescriptor(mocks);

        descriptor.describeEntity("/root/project/src/file.ts", "./file");
        descriptor.describeEntity("/root/project/src/file.ts", "./file");

        expect(mocks.elementsDescriptor.describeElement).toHaveBeenCalledTimes(
          1
        );
        expect(mocks.filesDescriptor.describeFile).toHaveBeenCalledTimes(1);
        expect(mocks.modulesDescriptor.describeModule).toHaveBeenCalledTimes(1);
      });

      it("should not cache results when cache is disabled", () => {
        const mocks = createDescriptorMocks();
        const descriptor = createEntitiesDescriptor(mocks, { cache: false });

        const first = descriptor.describeEntity("/root/project/src/file.ts");
        const second = descriptor.describeEntity("/root/project/src/file.ts");

        expect(first).not.toBe(second);
        expect(mocks.elementsDescriptor.describeElement).toHaveBeenCalledTimes(
          2
        );
      });
    });
  });

  describe("serializeCache", () => {
    it("should return a serialized cache with descriptions after describing an entity", () => {
      const mocks = createDescriptorMocks();
      const descriptor = createEntitiesDescriptor(mocks);

      descriptor.describeEntity("/root/project/src/file.ts", "./file");

      const serialized = descriptor.serializeCache();

      expect(serialized).toHaveProperty("descriptions");
      // eslint-disable-next-line jest/no-unnecessary-assertion
      expect(
        serialized.descriptions["/root/project/src/file.ts::./file"]
      ).toBeDefined();
    });

    it("should return an empty descriptions object when no entities have been described", () => {
      const mocks = createDescriptorMocks();
      const descriptor = createEntitiesDescriptor(mocks);

      const serialized = descriptor.serializeCache();

      expect(serialized).toEqual({ descriptions: {} });
    });
  });

  describe("setCacheFromSerialized", () => {
    it("should restore cache from serialized data", () => {
      const mocks = createDescriptorMocks();
      const descriptor = createEntitiesDescriptor(mocks);

      const cacheEntry: EntityDescription = {
        element: createElementDescription(),
        file: createFileDescription(),
        module: createModuleDescription(),
      };
      descriptor.setCacheFromSerialized({
        descriptions: { "/root/project/src/file.ts::./file": cacheEntry },
      });

      const result = descriptor.describeEntity(
        "/root/project/src/file.ts",
        "./file"
      );

      expect(result).toEqual(cacheEntry);
      expect(mocks.elementsDescriptor.describeElement).not.toHaveBeenCalled();
    });
  });

  describe("clearCache", () => {
    it("should clear all cached descriptions", () => {
      const mocks = createDescriptorMocks();
      const descriptor = createEntitiesDescriptor(mocks);

      descriptor.describeEntity("/root/project/src/file.ts", "./file");
      descriptor.clearCache();

      const serialized = descriptor.serializeCache();

      expect(serialized).toEqual({ descriptions: {} });
    });

    it("should re-describe entities after cache is cleared", () => {
      const mocks = createDescriptorMocks();
      const descriptor = createEntitiesDescriptor(mocks);

      descriptor.describeEntity("/root/project/src/file.ts", "./file");
      descriptor.clearCache();
      descriptor.describeEntity("/root/project/src/file.ts", "./file");

      expect(mocks.elementsDescriptor.describeElement).toHaveBeenCalledTimes(2);
    });
  });
});
