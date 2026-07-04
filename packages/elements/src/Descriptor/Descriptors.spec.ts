import type { DescriptorOptionsNormalized } from "../Config";
import type { Micromatch } from "../Matcher";

import type { DependencyDescription } from "./Dependency";
import { DependenciesDescriptor } from "./Dependency";
import { Descriptors } from "./Descriptors";
import type {
  DescriptorsConfig,
  DescriptorsSerializedCache,
} from "./Descriptors.types";
import type { ElementDescription } from "./Element";
import { ElementsDescriptor } from "./Element";
import type { EntityDescription } from "./Entity";
import { EntitiesDescriptor } from "./Entity";
import type { FileDescription } from "./File";
import { FilesDescriptor } from "./File";
import type { ModuleDescription } from "./Module";
import { ModulesDescriptor } from "./Module";

jest.mock("./Element");
jest.mock("./File");
jest.mock("./Module");
jest.mock("./Entity");
jest.mock("./Dependency");

const ElementsDescriptorMock = jest.mocked(ElementsDescriptor);
const FilesDescriptorMock = jest.mocked(FilesDescriptor);
const ModulesDescriptorMock = jest.mocked(ModulesDescriptor);
const EntitiesDescriptorMock = jest.mocked(EntitiesDescriptor);
const DependenciesDescriptorMock = jest.mocked(DependenciesDescriptor);

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

function createMicromatch(): Micromatch {
  return jest.fn() as unknown as Micromatch;
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

function createEntityDescription(
  overrides?: Partial<EntityDescription>
): EntityDescription {
  return {
    element: createElementDescription(),
    file: createFileDescription(),
    module: createModuleDescription(),
    ...overrides,
  };
}

function createDependencyDescription(
  overrides?: Partial<DependencyDescription>
): DependencyDescription {
  return {
    from: createEntityDescription(),
    to: createEntityDescription(),
    dependency: {
      source: "./B",
      kind: "value",
      nodeKind: null,
      specifiers: null,
      relationship: { from: null, to: null },
    },
    ...overrides,
  };
}

interface SubDescriptorMocks {
  elements: {
    describeElement: jest.Mock;
    serializeCache: jest.Mock;
    setCacheFromSerialized: jest.Mock;
    clearCache: jest.Mock;
  };
  files: {
    describeFile: jest.Mock;
    serializeCache: jest.Mock;
    setCacheFromSerialized: jest.Mock;
    clearCache: jest.Mock;
  };
  modules: {
    describeModule: jest.Mock;
    serializeCache: jest.Mock;
    setCacheFromSerialized: jest.Mock;
    clearCache: jest.Mock;
  };
  entities: {
    describeEntity: jest.Mock;
    serializeCache: jest.Mock;
    setCacheFromSerialized: jest.Mock;
    clearCache: jest.Mock;
  };
  dependencies: {
    describeDependency: jest.Mock;
    serializeCache: jest.Mock;
    setCacheFromSerialized: jest.Mock;
    clearCache: jest.Mock;
  };
}

function setupSubDescriptorMocks(): SubDescriptorMocks {
  const mocks: SubDescriptorMocks = {
    elements: {
      describeElement: jest.fn().mockReturnValue(createElementDescription()),
      serializeCache: jest.fn().mockReturnValue({}),
      setCacheFromSerialized: jest.fn(),
      clearCache: jest.fn(),
    },
    files: {
      describeFile: jest.fn().mockReturnValue(createFileDescription()),
      serializeCache: jest.fn().mockReturnValue({ descriptions: {} }),
      setCacheFromSerialized: jest.fn(),
      clearCache: jest.fn(),
    },
    modules: {
      describeModule: jest.fn().mockReturnValue(createModuleDescription()),
      serializeCache: jest.fn().mockReturnValue({ descriptions: {} }),
      setCacheFromSerialized: jest.fn(),
      clearCache: jest.fn(),
    },
    entities: {
      describeEntity: jest.fn().mockReturnValue(createEntityDescription()),
      serializeCache: jest.fn().mockReturnValue({ descriptions: {} }),
      setCacheFromSerialized: jest.fn(),
      clearCache: jest.fn(),
    },
    dependencies: {
      describeDependency: jest
        .fn()
        .mockReturnValue(createDependencyDescription()),
      serializeCache: jest.fn().mockReturnValue({}),
      setCacheFromSerialized: jest.fn(),
      clearCache: jest.fn(),
    },
  };

  ElementsDescriptorMock.mockReturnValue(
    mocks.elements as unknown as ElementsDescriptor
  );
  FilesDescriptorMock.mockReturnValue(
    mocks.files as unknown as FilesDescriptor
  );
  ModulesDescriptorMock.mockReturnValue(
    mocks.modules as unknown as ModulesDescriptor
  );
  EntitiesDescriptorMock.mockReturnValue(
    mocks.entities as unknown as EntitiesDescriptor
  );
  DependenciesDescriptorMock.mockReturnValue(
    mocks.dependencies as unknown as DependenciesDescriptor
  );

  return mocks;
}

function createDescriptors(
  descriptorsConfig?: Partial<DescriptorsConfig>,
  configOverrides?: Partial<DescriptorOptionsNormalized>
): Descriptors {
  return new Descriptors(
    { elements: [], files: [], ...descriptorsConfig },
    createConfig(configOverrides),
    createMicromatch()
  );
}

describe("Descriptors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create an instance", () => {
      setupSubDescriptorMocks();

      const descriptors = createDescriptors();

      expect(descriptors).toBeInstanceOf(Descriptors);
    });

    it("should create ElementsDescriptor with elements, config, micromatch, and elementsSingleType", () => {
      setupSubDescriptorMocks();
      const elements = [{ type: "component", pattern: "src/components/*" }];

      createDescriptors({ elements, elementsSingleType: true });

      expect(ElementsDescriptorMock).toHaveBeenCalledWith(
        elements,
        expect.objectContaining({ cache: true }),
        expect.any(Function),
        true
      );
    });

    it("should default elements to an empty array when not provided", () => {
      setupSubDescriptorMocks();

      createDescriptors({ elements: undefined });

      expect(ElementsDescriptorMock).toHaveBeenCalledWith(
        [],
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it("should default elementsSingleType to false when not provided", () => {
      setupSubDescriptorMocks();

      createDescriptors({ elementsSingleType: undefined });

      expect(ElementsDescriptorMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        false
      );
    });

    it("should create FilesDescriptor with files, config, and micromatch", () => {
      setupSubDescriptorMocks();
      const files = [
        { type: "source", pattern: "src/**/*.ts", category: "source" },
      ];

      createDescriptors({ files });

      expect(FilesDescriptorMock).toHaveBeenCalledWith(
        files,
        expect.objectContaining({ cache: true }),
        expect.any(Function)
      );
    });

    it("should default files to an empty array when not provided", () => {
      setupSubDescriptorMocks();

      createDescriptors({ files: undefined });

      expect(FilesDescriptorMock).toHaveBeenCalledWith(
        [],
        expect.anything(),
        expect.anything()
      );
    });

    it("should create ModulesDescriptor with config and micromatch", () => {
      setupSubDescriptorMocks();

      createDescriptors();

      expect(ModulesDescriptorMock).toHaveBeenCalledWith(
        expect.objectContaining({ cache: true }),
        expect.any(Function)
      );
    });

    it("should create EntitiesDescriptor with elements, files, modules descriptors, and config", () => {
      const mocks = setupSubDescriptorMocks();

      createDescriptors();

      expect(EntitiesDescriptorMock).toHaveBeenCalledWith(
        mocks.elements,
        mocks.files,
        mocks.modules,
        expect.objectContaining({ cache: true })
      );
    });

    it("should create DependenciesDescriptor with entities descriptor and config", () => {
      const mocks = setupSubDescriptorMocks();

      createDescriptors();

      expect(DependenciesDescriptorMock).toHaveBeenCalledWith(
        mocks.entities,
        expect.objectContaining({ cache: true })
      );
    });
  });

  describe("describeElement", () => {
    it("should delegate to ElementsDescriptor", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();

      descriptors.describeElement("/root/project/src/file.ts");

      expect(mocks.elements.describeElement).toHaveBeenCalledWith(
        "/root/project/src/file.ts"
      );
    });

    it("should return the result from ElementsDescriptor", () => {
      const mocks = setupSubDescriptorMocks();
      const expectedDescription = createElementDescription({
        types: ["service"],
      });
      mocks.elements.describeElement.mockReturnValue(expectedDescription);
      const descriptors = createDescriptors();

      const result = descriptors.describeElement("/root/project/src/file.ts");

      expect(result).toBe(expectedDescription);
    });

    it("should handle undefined filePath", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();

      descriptors.describeElement(undefined);

      expect(mocks.elements.describeElement).toHaveBeenCalledWith(undefined);
    });
  });

  describe("describeFile", () => {
    it("should delegate to FilesDescriptor", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();

      descriptors.describeFile("/root/project/src/file.ts");

      expect(mocks.files.describeFile).toHaveBeenCalledWith(
        "/root/project/src/file.ts"
      );
    });

    it("should return the result from FilesDescriptor", () => {
      const mocks = setupSubDescriptorMocks();
      const expectedDescription = createFileDescription({
        categories: ["source"],
      });
      mocks.files.describeFile.mockReturnValue(expectedDescription);
      const descriptors = createDescriptors();

      const result = descriptors.describeFile("/root/project/src/file.ts");

      expect(result).toBe(expectedDescription);
    });
  });

  describe("describeEntity", () => {
    it("should delegate to EntitiesDescriptor with filePath and source", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();

      descriptors.describeEntity("/root/project/src/file.ts", "./file");

      expect(mocks.entities.describeEntity).toHaveBeenCalledWith(
        "/root/project/src/file.ts",
        "./file"
      );
    });

    it("should return the result from EntitiesDescriptor", () => {
      const mocks = setupSubDescriptorMocks();
      const expectedDescription = createEntityDescription({
        element: createElementDescription({ types: ["service"] }),
      });
      mocks.entities.describeEntity.mockReturnValue(expectedDescription);
      const descriptors = createDescriptors();

      const result = descriptors.describeEntity(
        "/root/project/src/file.ts",
        "./file"
      );

      expect(result).toBe(expectedDescription);
    });

    it("should handle undefined source", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();

      descriptors.describeEntity("/root/project/src/file.ts");

      expect(mocks.entities.describeEntity).toHaveBeenCalledWith(
        "/root/project/src/file.ts",
        undefined
      );
    });
  });

  describe("describeModule", () => {
    it("should delegate to ModulesDescriptor with filePath and source", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();

      descriptors.describeModule("/root/project/src/file.ts", "./file");

      expect(mocks.modules.describeModule).toHaveBeenCalledWith(
        "/root/project/src/file.ts",
        "./file"
      );
    });

    it("should return the result from ModulesDescriptor", () => {
      const mocks = setupSubDescriptorMocks();
      const expectedDescription = createModuleDescription({
        origin: "external",
        source: "lodash",
      });
      mocks.modules.describeModule.mockReturnValue(expectedDescription);
      const descriptors = createDescriptors();

      const result = descriptors.describeModule("lodash", "lodash");

      expect(result).toBe(expectedDescription);
    });

    it("should handle undefined filePath and source", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();

      descriptors.describeModule();

      expect(mocks.modules.describeModule).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });
  });

  describe("describeDependency", () => {
    it("should delegate to DependenciesDescriptor", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();
      const options = {
        from: "/A",
        to: "/B",
        source: "./B",
        kind: "value" as const,
      };

      descriptors.describeDependency(options);

      expect(mocks.dependencies.describeDependency).toHaveBeenCalledWith(
        options
      );
    });

    it("should return the result from DependenciesDescriptor", () => {
      const mocks = setupSubDescriptorMocks();
      const expectedDescription = createDependencyDescription({
        dependency: {
          source: "./B",
          kind: "value",
          nodeKind: "ImportDeclaration",
          specifiers: ["default"],
          relationship: { from: null, to: null },
        },
      });
      mocks.dependencies.describeDependency.mockReturnValue(
        expectedDescription
      );
      const descriptors = createDescriptors();

      const result = descriptors.describeDependency({
        from: "/A",
        to: "/B",
        source: "./B",
        kind: "value",
      });

      expect(result).toBe(expectedDescription);
    });
  });

  describe("serializeCache", () => {
    it("should return serialized cache from all sub-descriptors", () => {
      const mocks = setupSubDescriptorMocks();
      const elementsCache = {
        "src/components/Foo.ts": createElementDescription(),
      };
      const filesCache = {
        descriptions: { "src/file.ts": createFileDescription() },
      };
      const entitiesCache = {
        descriptions: { "src/file.ts::./file": createEntityDescription() },
      };
      const dependenciesCache = {
        "/A|/B|./B|value|undefined|": createDependencyDescription(),
      };
      const modulesCache = {
        descriptions: { "lodash::lodash": createModuleDescription() },
      };

      mocks.elements.serializeCache.mockReturnValue(elementsCache);
      mocks.files.serializeCache.mockReturnValue(filesCache);
      mocks.entities.serializeCache.mockReturnValue(entitiesCache);
      mocks.dependencies.serializeCache.mockReturnValue(dependenciesCache);
      mocks.modules.serializeCache.mockReturnValue(modulesCache);

      const descriptors = createDescriptors();

      const result = descriptors.serializeCache();

      expect(result).toEqual({
        elements: elementsCache,
        files: filesCache,
        entities: entitiesCache,
        dependencies: dependenciesCache,
        modules: modulesCache,
      });
    });

    it("should call serializeCache on each sub-descriptor", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();

      descriptors.serializeCache();

      expect(mocks.elements.serializeCache).toHaveBeenCalledTimes(1);
      expect(mocks.files.serializeCache).toHaveBeenCalledTimes(1);
      expect(mocks.entities.serializeCache).toHaveBeenCalledTimes(1);
      expect(mocks.dependencies.serializeCache).toHaveBeenCalledTimes(1);
      expect(mocks.modules.serializeCache).toHaveBeenCalledTimes(1);
    });
  });

  describe("setCacheFromSerialized", () => {
    it("should delegate to each sub-descriptor with the corresponding cache", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();
      const serializedCache: DescriptorsSerializedCache = {
        elements: { "src/components/Foo.ts": createElementDescription() },
        files: { descriptions: { "src/file.ts": createFileDescription() } },
        entities: {
          descriptions: {
            "src/file.ts::./file": createEntityDescription(),
          },
        },
        dependencies: {
          "/A|/B|./B|value|undefined|": createDependencyDescription(),
        },
        modules: {
          descriptions: {
            "lodash::lodash": createModuleDescription(),
          },
        },
      };

      descriptors.setCacheFromSerialized(serializedCache);

      expect(mocks.elements.setCacheFromSerialized).toHaveBeenCalledWith(
        serializedCache.elements
      );
      expect(mocks.files.setCacheFromSerialized).toHaveBeenCalledWith(
        serializedCache.files
      );
      expect(mocks.entities.setCacheFromSerialized).toHaveBeenCalledWith(
        serializedCache.entities
      );
      expect(mocks.dependencies.setCacheFromSerialized).toHaveBeenCalledWith(
        serializedCache.dependencies
      );
      expect(mocks.modules.setCacheFromSerialized).toHaveBeenCalledWith(
        serializedCache.modules
      );
    });

    it("should call setCacheFromSerialized on each sub-descriptor exactly once", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();
      const serializedCache: DescriptorsSerializedCache = {
        elements: {},
        files: { descriptions: {} },
        entities: { descriptions: {} },
        dependencies: {},
        modules: { descriptions: {} },
      };

      descriptors.setCacheFromSerialized(serializedCache);

      expect(mocks.elements.setCacheFromSerialized).toHaveBeenCalledTimes(1);
      expect(mocks.files.setCacheFromSerialized).toHaveBeenCalledTimes(1);
      expect(mocks.entities.setCacheFromSerialized).toHaveBeenCalledTimes(1);
      expect(mocks.dependencies.setCacheFromSerialized).toHaveBeenCalledTimes(
        1
      );
      expect(mocks.modules.setCacheFromSerialized).toHaveBeenCalledTimes(1);
    });
  });

  describe("clearCache", () => {
    it("should call clearCache on each sub-descriptor", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();

      descriptors.clearCache();

      expect(mocks.elements.clearCache).toHaveBeenCalledTimes(1);
      expect(mocks.files.clearCache).toHaveBeenCalledTimes(1);
      expect(mocks.entities.clearCache).toHaveBeenCalledTimes(1);
      expect(mocks.dependencies.clearCache).toHaveBeenCalledTimes(1);
      expect(mocks.modules.clearCache).toHaveBeenCalledTimes(1);
    });

    it("should call clearCache with no arguments on each sub-descriptor", () => {
      const mocks = setupSubDescriptorMocks();
      const descriptors = createDescriptors();

      descriptors.clearCache();

      expect(mocks.elements.clearCache).toHaveBeenCalledWith();
      expect(mocks.files.clearCache).toHaveBeenCalledWith();
      expect(mocks.entities.clearCache).toHaveBeenCalledWith();
      expect(mocks.dependencies.clearCache).toHaveBeenCalledWith();
      expect(mocks.modules.clearCache).toHaveBeenCalledWith();
    });
  });
});
