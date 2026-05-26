import type {
  DescriptorOptionsNormalized,
  MatchersOptionsNormalized,
} from "../Config";
import type {
  DependencyDescriptorOptions,
  ElementDescription,
  DependencyDescription,
  EntityDescription,
  ModuleDescription,
  DescriptorsConfig,
  DescriptorsSerializedCache,
} from "../Descriptor";
import { Descriptors } from "../Descriptor";
import {
  getLegacyDependencySelectorExtraTemplateData,
  getLegacyElementSelectorExtraTemplateData,
  getLegacyEntitySelectorExtraTemplateData,
} from "../Legacy";

import type { BackwardCompatibleDependencySelector } from "./Dependency";
import { DependenciesMatcher } from "./Dependency";
import type { BackwardCompatibleElementSelector } from "./Element";
import { ElementsMatcher } from "./Element";
import { EntitiesMatcher } from "./Entity";
import type { BackwardCompatibleEntitySelector } from "./Entity";
import { FilesMatcher } from "./File";
import { Matcher } from "./Matcher";
import type { ModuleSelector } from "./Module";
import { ModulesMatcher } from "./Module";
import type { Micromatch } from "./Shared";

jest.mock("../Descriptor");
jest.mock("../Legacy");
jest.mock("./Dependency");
jest.mock("./Element");
jest.mock("./Entity");
jest.mock("./File");
jest.mock("./Module");

const MockedDescriptors = jest.mocked(Descriptors);
const MockedElementsMatcher = jest.mocked(ElementsMatcher);
const MockedFilesMatcher = jest.mocked(FilesMatcher);
const MockedModulesMatcher = jest.mocked(ModulesMatcher);
const MockedEntitiesMatcher = jest.mocked(EntitiesMatcher);
const MockedDependenciesMatcher = jest.mocked(DependenciesMatcher);
const mockedGetLegacyElementExtra = jest.mocked(
  getLegacyElementSelectorExtraTemplateData
);
const mockedGetLegacyEntityExtra = jest.mocked(
  getLegacyEntitySelectorExtraTemplateData
);
const mockedGetLegacyDependencyExtra = jest.mocked(
  getLegacyDependencySelectorExtraTemplateData
);

describe("Matcher", () => {
  const MOCK_DESCRIPTORS_CONFIG = {
    elements: [],
  } as unknown as DescriptorsConfig;

  const MOCK_DESCRIPTOR_OPTIONS = {
    ignorePaths: [],
  } as unknown as DescriptorOptionsNormalized;

  const MOCK_MATCHERS_OPTIONS = {
    legacyTemplates: true,
  } as unknown as MatchersOptionsNormalized;

  const MOCK_MICROMATCH = {} as unknown as Micromatch;
  const MOCK_FILE_PATH = "src/components/Button/index.ts";
  const MOCK_SOURCE = "some-source";

  const MOCK_ELEMENT_DESCRIPTION = {
    path: "Button",
    types: ["component"],
  } as unknown as ElementDescription;

  const MOCK_MODULE_DESCRIPTION = {
    origin: "local" as const,
  } as unknown as ModuleDescription;

  const MOCK_ENTITY_DESCRIPTION = {
    element: MOCK_ELEMENT_DESCRIPTION,
    module: MOCK_MODULE_DESCRIPTION,
  } as unknown as EntityDescription;

  const MOCK_DEPENDENCY_DESCRIPTION = {
    from: MOCK_ENTITY_DESCRIPTION,
    to: MOCK_ENTITY_DESCRIPTION,
  } as unknown as DependencyDescription;

  const MOCK_DEPENDENCY_DATA = {
    filePath: MOCK_FILE_PATH,
  } as unknown as DependencyDescriptorOptions;

  const MOCK_ELEMENT_SELECTOR =
    "component" as unknown as BackwardCompatibleElementSelector;
  const MOCK_ENTITY_SELECTOR =
    "entity" as unknown as BackwardCompatibleEntitySelector;
  const MOCK_DEPENDENCY_SELECTOR =
    "dependency" as unknown as BackwardCompatibleDependencySelector;
  const MOCK_MODULE_SELECTOR = "module" as unknown as ModuleSelector;

  const MOCK_LEGACY_ELEMENT_DATA = { element: { elementPath: "Button" } };
  const MOCK_LEGACY_ENTITY_DATA = { element: { elementPath: "Button" } };
  const MOCK_LEGACY_DEPENDENCY_DATA = { from: { elementPath: "Button" } };

  const MOCK_MATCH_RESULT = { type: "component" };

  const MOCK_SERIALIZED_DESCRIPTORS_CACHE =
    {} as unknown as DescriptorsSerializedCache;

  let descriptorsInstance: {
    describeElement: jest.Mock;
    describeDependency: jest.Mock;
    describeEntity: jest.Mock;
    describeModule: jest.Mock;
    clearCache: jest.Mock;
    serializeCache: jest.Mock;
    setCacheFromSerialized: jest.Mock;
  };

  let elementsMatcherInstance: {
    isElementMatch: jest.Mock;
    getSelectorMatching: jest.Mock;
  };

  let modulesMatcherInstance: {
    isModuleMatch: jest.Mock;
    getSelectorMatching: jest.Mock;
  };

  let entitiesMatcherInstance: {
    isEntityMatch: jest.Mock;
    getSelectorMatching: jest.Mock;
  };

  let dependenciesMatcherInstance: {
    isDependencyMatch: jest.Mock;
    getSelectorMatching: jest.Mock;
  };

  let matcher: Matcher;

  beforeEach(() => {
    descriptorsInstance = {
      describeElement: jest.fn().mockReturnValue(MOCK_ELEMENT_DESCRIPTION),
      describeDependency: jest
        .fn()
        .mockReturnValue(MOCK_DEPENDENCY_DESCRIPTION),
      describeEntity: jest.fn().mockReturnValue(MOCK_ENTITY_DESCRIPTION),
      describeModule: jest.fn().mockReturnValue(MOCK_MODULE_DESCRIPTION),
      clearCache: jest.fn(),
      serializeCache: jest
        .fn()
        .mockReturnValue(MOCK_SERIALIZED_DESCRIPTORS_CACHE),
      setCacheFromSerialized: jest.fn(),
    };

    elementsMatcherInstance = {
      isElementMatch: jest.fn().mockReturnValue(true),
      getSelectorMatching: jest.fn().mockReturnValue(MOCK_MATCH_RESULT),
    };

    const filesMatcherInstance = {
      isFileMatch: jest.fn(),
      getSelectorMatching: jest.fn(),
    };

    modulesMatcherInstance = {
      isModuleMatch: jest.fn().mockReturnValue(true),
      getSelectorMatching: jest.fn().mockReturnValue(MOCK_MATCH_RESULT),
    };

    entitiesMatcherInstance = {
      isEntityMatch: jest.fn().mockReturnValue(true),
      getSelectorMatching: jest.fn().mockReturnValue(MOCK_MATCH_RESULT),
    };

    dependenciesMatcherInstance = {
      isDependencyMatch: jest.fn().mockReturnValue(true),
      getSelectorMatching: jest.fn().mockReturnValue(MOCK_MATCH_RESULT),
    };

    MockedDescriptors.mockReturnValue(
      descriptorsInstance as unknown as Descriptors
    );
    MockedElementsMatcher.mockReturnValue(
      elementsMatcherInstance as unknown as ElementsMatcher
    );
    MockedFilesMatcher.mockReturnValue(
      filesMatcherInstance as unknown as FilesMatcher
    );
    MockedModulesMatcher.mockReturnValue(
      modulesMatcherInstance as unknown as ModulesMatcher
    );
    MockedEntitiesMatcher.mockReturnValue(
      entitiesMatcherInstance as unknown as EntitiesMatcher
    );
    MockedDependenciesMatcher.mockReturnValue(
      dependenciesMatcherInstance as unknown as DependenciesMatcher
    );

    mockedGetLegacyElementExtra.mockReturnValue(MOCK_LEGACY_ELEMENT_DATA);
    mockedGetLegacyEntityExtra.mockReturnValue(MOCK_LEGACY_ENTITY_DATA);
    mockedGetLegacyDependencyExtra.mockReturnValue(MOCK_LEGACY_DEPENDENCY_DATA);

    matcher = new Matcher({
      descriptors: MOCK_DESCRIPTORS_CONFIG,
      options: {
        descriptors: MOCK_DESCRIPTOR_OPTIONS,
        matchers: MOCK_MATCHERS_OPTIONS,
      },
      micromatch: MOCK_MICROMATCH,
    });
  });

  describe("constructor", () => {
    it("should create a Descriptors instance with the provided config, options, and micromatch", () => {
      expect(MockedDescriptors).toHaveBeenCalledWith(
        MOCK_DESCRIPTORS_CONFIG,
        MOCK_DESCRIPTOR_OPTIONS,
        MOCK_MICROMATCH
      );
    });

    it("should create an ElementsMatcher with matchersOptions and micromatch", () => {
      expect(MockedElementsMatcher).toHaveBeenCalledWith(
        MOCK_MATCHERS_OPTIONS,
        MOCK_MICROMATCH
      );
    });

    it("should create a FilesMatcher with matchersOptions and micromatch", () => {
      expect(MockedFilesMatcher).toHaveBeenCalledWith(
        MOCK_MATCHERS_OPTIONS,
        MOCK_MICROMATCH
      );
    });

    it("should create a ModulesMatcher with matchersOptions and micromatch", () => {
      expect(MockedModulesMatcher).toHaveBeenCalledWith(
        MOCK_MATCHERS_OPTIONS,
        MOCK_MICROMATCH
      );
    });

    it("should create an EntitiesMatcher with sub-matchers, matchersOptions, and micromatch", () => {
      expect(MockedEntitiesMatcher).toHaveBeenCalledWith(
        MockedElementsMatcher.mock.results[0].value,
        MockedFilesMatcher.mock.results[0].value,
        MockedModulesMatcher.mock.results[0].value,
        MOCK_MATCHERS_OPTIONS,
        MOCK_MICROMATCH
      );
    });

    it("should create a DependenciesMatcher with entitiesMatcher, matchersOptions, and micromatch", () => {
      expect(MockedDependenciesMatcher).toHaveBeenCalledWith(
        MockedEntitiesMatcher.mock.results[0].value,
        MOCK_MATCHERS_OPTIONS,
        MOCK_MICROMATCH
      );
    });
  });

  describe("describeElement", () => {
    it("should delegate to Descriptors and return the result", () => {
      const result = matcher.describeElement(MOCK_FILE_PATH);

      expect(descriptorsInstance.describeElement).toHaveBeenCalledWith(
        MOCK_FILE_PATH
      );
      expect(result).toBe(MOCK_ELEMENT_DESCRIPTION);
    });
  });

  describe("describeDependency", () => {
    it("should delegate to Descriptors and return the result", () => {
      const result = matcher.describeDependency(MOCK_DEPENDENCY_DATA);

      expect(descriptorsInstance.describeDependency).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DATA
      );
      expect(result).toBe(MOCK_DEPENDENCY_DESCRIPTION);
    });
  });

  describe("describeEntity", () => {
    it("should delegate to Descriptors with file path and source", () => {
      const result = matcher.describeEntity(MOCK_FILE_PATH, MOCK_SOURCE);

      expect(descriptorsInstance.describeEntity).toHaveBeenCalledWith(
        MOCK_FILE_PATH,
        MOCK_SOURCE
      );
      expect(result).toBe(MOCK_ENTITY_DESCRIPTION);
    });

    it("should delegate to Descriptors without source when not provided", () => {
      matcher.describeEntity(MOCK_FILE_PATH);

      expect(descriptorsInstance.describeEntity).toHaveBeenCalledWith(
        MOCK_FILE_PATH,
        undefined
      );
    });
  });

  describe("describeModule", () => {
    it("should delegate to Descriptors with file path and source", () => {
      const result = matcher.describeModule(MOCK_FILE_PATH, MOCK_SOURCE);

      expect(descriptorsInstance.describeModule).toHaveBeenCalledWith(
        MOCK_FILE_PATH,
        MOCK_SOURCE
      );
      expect(result).toBe(MOCK_MODULE_DESCRIPTION);
    });

    it("should delegate to Descriptors without arguments", () => {
      matcher.describeModule();

      expect(descriptorsInstance.describeModule).toHaveBeenCalledWith(
        undefined,
        undefined
      );
    });
  });

  describe("isElementMatch", () => {
    it("should describe element and module, apply legacy template data, and delegate to ElementsMatcher", () => {
      const result = matcher.isElementMatch(
        MOCK_FILE_PATH,
        MOCK_ELEMENT_SELECTOR
      );

      expect(descriptorsInstance.describeElement).toHaveBeenCalledWith(
        MOCK_FILE_PATH
      );
      expect(descriptorsInstance.describeModule).toHaveBeenCalledWith(
        MOCK_FILE_PATH
      );
      expect(mockedGetLegacyElementExtra).toHaveBeenCalledWith(
        MOCK_ELEMENT_DESCRIPTION,
        MOCK_MODULE_DESCRIPTION
      );
      expect(elementsMatcherInstance.isElementMatch).toHaveBeenCalledWith(
        MOCK_ELEMENT_DESCRIPTION,
        MOCK_ELEMENT_SELECTOR,
        { extraTemplateData: { ...MOCK_LEGACY_ELEMENT_DATA } }
      );
      expect(result).toBe(true);
    });

    it("should merge user extraTemplateData over legacy template data", () => {
      const userExtra = { custom: "value" };

      matcher.isElementMatch(MOCK_FILE_PATH, MOCK_ELEMENT_SELECTOR, {
        extraTemplateData: userExtra,
      });

      expect(elementsMatcherInstance.isElementMatch).toHaveBeenCalledWith(
        MOCK_ELEMENT_DESCRIPTION,
        MOCK_ELEMENT_SELECTOR,
        {
          extraTemplateData: { ...MOCK_LEGACY_ELEMENT_DATA, ...userExtra },
        }
      );
    });

    it("should return false when ElementsMatcher returns false", () => {
      elementsMatcherInstance.isElementMatch.mockReturnValue(false);

      const result = matcher.isElementMatch(
        MOCK_FILE_PATH,
        MOCK_ELEMENT_SELECTOR
      );

      expect(result).toBe(false);
    });
  });

  describe("isDependencyMatch", () => {
    it("should describe dependency, apply legacy template data, and delegate to DependenciesMatcher", () => {
      const result = matcher.isDependencyMatch(
        MOCK_DEPENDENCY_DATA,
        MOCK_DEPENDENCY_SELECTOR
      );

      expect(descriptorsInstance.describeDependency).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DATA
      );
      expect(mockedGetLegacyDependencyExtra).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DESCRIPTION,
        undefined
      );
      expect(
        dependenciesMatcherInstance.isDependencyMatch
      ).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DESCRIPTION,
        MOCK_DEPENDENCY_SELECTOR,
        {
          extraTemplateData: MOCK_LEGACY_DEPENDENCY_DATA,
        }
      );
      expect(result).toBe(true);
    });

    it("should pass options extraTemplateData to the legacy helper", () => {
      const userExtra = { custom: "value" };

      matcher.isDependencyMatch(
        MOCK_DEPENDENCY_DATA,
        MOCK_DEPENDENCY_SELECTOR,
        { extraTemplateData: userExtra }
      );

      expect(mockedGetLegacyDependencyExtra).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DESCRIPTION,
        userExtra
      );
    });
  });

  describe("isEntityMatch", () => {
    it("should describe entity with source, apply legacy template data, and delegate to EntitiesMatcher", () => {
      const userExtra = { custom: "value" };

      const result = matcher.isEntityMatch(
        MOCK_FILE_PATH,
        MOCK_ENTITY_SELECTOR,
        { source: MOCK_SOURCE, extraTemplateData: userExtra }
      );

      expect(descriptorsInstance.describeEntity).toHaveBeenCalledWith(
        MOCK_FILE_PATH,
        MOCK_SOURCE
      );
      expect(mockedGetLegacyEntityExtra).toHaveBeenCalledWith(
        MOCK_ENTITY_DESCRIPTION
      );
      expect(entitiesMatcherInstance.isEntityMatch).toHaveBeenCalledWith(
        MOCK_ENTITY_DESCRIPTION,
        MOCK_ENTITY_SELECTOR,
        {
          source: MOCK_SOURCE,
          extraTemplateData: { ...MOCK_LEGACY_ENTITY_DATA, ...userExtra },
        }
      );
      expect(result).toBe(true);
    });

    it("should call describeEntity without source when options is undefined", () => {
      matcher.isEntityMatch(MOCK_FILE_PATH, MOCK_ENTITY_SELECTOR);

      expect(descriptorsInstance.describeEntity).toHaveBeenCalledWith(
        MOCK_FILE_PATH,
        undefined
      );
    });
  });

  describe("isModuleMatch", () => {
    it("should describe module with source and delegate directly to ModulesMatcher", () => {
      const options = { source: MOCK_SOURCE };

      const result = matcher.isModuleMatch(
        MOCK_FILE_PATH,
        MOCK_MODULE_SELECTOR,
        options
      );

      expect(descriptorsInstance.describeModule).toHaveBeenCalledWith(
        MOCK_FILE_PATH,
        MOCK_SOURCE
      );
      expect(modulesMatcherInstance.isModuleMatch).toHaveBeenCalledWith(
        MOCK_MODULE_DESCRIPTION,
        MOCK_MODULE_SELECTOR,
        options
      );
      expect(result).toBe(true);
    });

    it("should not apply any legacy template data enrichment", () => {
      matcher.isModuleMatch(MOCK_FILE_PATH, MOCK_MODULE_SELECTOR);

      expect(mockedGetLegacyElementExtra).not.toHaveBeenCalled();
      expect(mockedGetLegacyEntityExtra).not.toHaveBeenCalled();
      expect(mockedGetLegacyDependencyExtra).not.toHaveBeenCalled();
    });

    it("should pass options directly without modification", () => {
      const options = {
        source: MOCK_SOURCE,
        extraTemplateData: { custom: "value" },
      };

      matcher.isModuleMatch(MOCK_FILE_PATH, MOCK_MODULE_SELECTOR, options);

      expect(modulesMatcherInstance.isModuleMatch).toHaveBeenCalledWith(
        MOCK_MODULE_DESCRIPTION,
        MOCK_MODULE_SELECTOR,
        options
      );
    });
  });

  describe("getEntitySelectorMatching", () => {
    it("should describe entity with source, apply legacy template data, and delegate to EntitiesMatcher.getSelectorMatching", () => {
      const result = matcher.getEntitySelectorMatching(
        MOCK_FILE_PATH,
        MOCK_ENTITY_SELECTOR,
        { source: MOCK_SOURCE }
      );

      expect(descriptorsInstance.describeEntity).toHaveBeenCalledWith(
        MOCK_FILE_PATH,
        MOCK_SOURCE
      );
      expect(entitiesMatcherInstance.getSelectorMatching).toHaveBeenCalledWith(
        MOCK_ENTITY_DESCRIPTION,
        MOCK_ENTITY_SELECTOR,
        {
          source: MOCK_SOURCE,
          extraTemplateData: { ...MOCK_LEGACY_ENTITY_DATA },
        }
      );
      expect(result).toBe(MOCK_MATCH_RESULT);
    });

    it("should merge user extraTemplateData over legacy data", () => {
      const userExtra = { custom: "val" };

      matcher.getEntitySelectorMatching(MOCK_FILE_PATH, MOCK_ENTITY_SELECTOR, {
        extraTemplateData: userExtra,
      });

      expect(entitiesMatcherInstance.getSelectorMatching).toHaveBeenCalledWith(
        MOCK_ENTITY_DESCRIPTION,
        MOCK_ENTITY_SELECTOR,
        {
          extraTemplateData: { ...MOCK_LEGACY_ENTITY_DATA, ...userExtra },
        }
      );
    });
  });

  describe("getElementSelectorMatching", () => {
    it("should describe element and module, apply legacy template data, and delegate to ElementsMatcher.getSelectorMatching", () => {
      const result = matcher.getElementSelectorMatching(
        MOCK_FILE_PATH,
        MOCK_ELEMENT_SELECTOR
      );

      expect(descriptorsInstance.describeElement).toHaveBeenCalledWith(
        MOCK_FILE_PATH
      );
      expect(descriptorsInstance.describeModule).toHaveBeenCalledWith(
        MOCK_FILE_PATH
      );
      expect(mockedGetLegacyElementExtra).toHaveBeenCalledWith(
        MOCK_ELEMENT_DESCRIPTION,
        MOCK_MODULE_DESCRIPTION
      );
      expect(elementsMatcherInstance.getSelectorMatching).toHaveBeenCalledWith(
        MOCK_ELEMENT_DESCRIPTION,
        MOCK_ELEMENT_SELECTOR,
        { extraTemplateData: { ...MOCK_LEGACY_ELEMENT_DATA } }
      );
      expect(result).toBe(MOCK_MATCH_RESULT);
    });

    it("should merge user extraTemplateData over legacy data", () => {
      const userExtra = { custom: "val" };

      matcher.getElementSelectorMatching(
        MOCK_FILE_PATH,
        MOCK_ELEMENT_SELECTOR,
        { extraTemplateData: userExtra }
      );

      expect(elementsMatcherInstance.getSelectorMatching).toHaveBeenCalledWith(
        MOCK_ELEMENT_DESCRIPTION,
        MOCK_ELEMENT_SELECTOR,
        {
          extraTemplateData: { ...MOCK_LEGACY_ELEMENT_DATA, ...userExtra },
        }
      );
    });
  });

  describe("getDependencySelectorMatching", () => {
    it("should describe dependency, apply legacy template data, and delegate to DependenciesMatcher.getSelectorMatching", () => {
      const result = matcher.getDependencySelectorMatching(
        MOCK_DEPENDENCY_DATA,
        MOCK_DEPENDENCY_SELECTOR
      );

      expect(descriptorsInstance.describeDependency).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DATA
      );
      expect(mockedGetLegacyDependencyExtra).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DESCRIPTION,
        undefined
      );
      expect(
        dependenciesMatcherInstance.getSelectorMatching
      ).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DESCRIPTION,
        MOCK_DEPENDENCY_SELECTOR,
        { extraTemplateData: MOCK_LEGACY_DEPENDENCY_DATA }
      );
      expect(result).toBe(MOCK_MATCH_RESULT);
    });

    it("should pass extraTemplateData to the legacy helper as second argument", () => {
      const userExtra = { custom: "val" };

      matcher.getDependencySelectorMatching(
        MOCK_DEPENDENCY_DATA,
        MOCK_DEPENDENCY_SELECTOR,
        { extraTemplateData: userExtra }
      );

      expect(mockedGetLegacyDependencyExtra).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DESCRIPTION,
        userExtra
      );
    });
  });

  describe("getModuleSelectorMatching", () => {
    it("should describe module with source and delegate to ModulesMatcher.getSelectorMatching", () => {
      const options = { source: MOCK_SOURCE };

      const result = matcher.getModuleSelectorMatching(
        MOCK_FILE_PATH,
        MOCK_MODULE_SELECTOR,
        options
      );

      expect(descriptorsInstance.describeModule).toHaveBeenCalledWith(
        MOCK_FILE_PATH,
        MOCK_SOURCE
      );
      expect(modulesMatcherInstance.getSelectorMatching).toHaveBeenCalledWith(
        MOCK_MODULE_DESCRIPTION,
        MOCK_MODULE_SELECTOR,
        options
      );
      expect(result).toBe(MOCK_MATCH_RESULT);
    });

    it("should not apply any legacy template data enrichment", () => {
      matcher.getModuleSelectorMatching(MOCK_FILE_PATH, MOCK_MODULE_SELECTOR);

      expect(mockedGetLegacyElementExtra).not.toHaveBeenCalled();
      expect(mockedGetLegacyEntityExtra).not.toHaveBeenCalled();
      expect(mockedGetLegacyDependencyExtra).not.toHaveBeenCalled();
    });
  });

  describe("getEntitySelectorMatchingDescription", () => {
    it("should apply legacy entity template data to the provided description and delegate", () => {
      const result = matcher.getEntitySelectorMatchingDescription(
        MOCK_ENTITY_DESCRIPTION,
        MOCK_ENTITY_SELECTOR
      );

      expect(mockedGetLegacyEntityExtra).toHaveBeenCalledWith(
        MOCK_ENTITY_DESCRIPTION
      );
      expect(entitiesMatcherInstance.getSelectorMatching).toHaveBeenCalledWith(
        MOCK_ENTITY_DESCRIPTION,
        MOCK_ENTITY_SELECTOR,
        { extraTemplateData: { ...MOCK_LEGACY_ENTITY_DATA } }
      );
      expect(result).toBe(MOCK_MATCH_RESULT);
    });

    it("should merge user extraTemplateData over legacy data", () => {
      const userExtra = { custom: "val" };

      matcher.getEntitySelectorMatchingDescription(
        MOCK_ENTITY_DESCRIPTION,
        MOCK_ENTITY_SELECTOR,
        { extraTemplateData: userExtra }
      );

      expect(entitiesMatcherInstance.getSelectorMatching).toHaveBeenCalledWith(
        MOCK_ENTITY_DESCRIPTION,
        MOCK_ENTITY_SELECTOR,
        {
          extraTemplateData: { ...MOCK_LEGACY_ENTITY_DATA, ...userExtra },
        }
      );
    });

    it("should not call any describe method", () => {
      descriptorsInstance.describeEntity.mockClear();
      descriptorsInstance.describeElement.mockClear();
      descriptorsInstance.describeModule.mockClear();

      matcher.getEntitySelectorMatchingDescription(
        MOCK_ENTITY_DESCRIPTION,
        MOCK_ENTITY_SELECTOR
      );

      expect(descriptorsInstance.describeEntity).not.toHaveBeenCalled();
      expect(descriptorsInstance.describeElement).not.toHaveBeenCalled();
      expect(descriptorsInstance.describeModule).not.toHaveBeenCalled();
    });
  });

  describe("getDependencySelectorMatchingDescription", () => {
    it("should apply legacy dependency template data to the provided description and delegate", () => {
      const result = matcher.getDependencySelectorMatchingDescription(
        MOCK_DEPENDENCY_DESCRIPTION,
        MOCK_DEPENDENCY_SELECTOR
      );

      expect(mockedGetLegacyDependencyExtra).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DESCRIPTION,
        undefined
      );
      expect(
        dependenciesMatcherInstance.getSelectorMatching
      ).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DESCRIPTION,
        MOCK_DEPENDENCY_SELECTOR,
        { extraTemplateData: MOCK_LEGACY_DEPENDENCY_DATA }
      );
      expect(result).toBe(MOCK_MATCH_RESULT);
    });

    it("should pass extraTemplateData to the legacy helper as second argument", () => {
      const userExtra = { custom: "val" };

      matcher.getDependencySelectorMatchingDescription(
        MOCK_DEPENDENCY_DESCRIPTION,
        MOCK_DEPENDENCY_SELECTOR,
        { extraTemplateData: userExtra }
      );

      expect(mockedGetLegacyDependencyExtra).toHaveBeenCalledWith(
        MOCK_DEPENDENCY_DESCRIPTION,
        userExtra
      );
    });
  });

  describe("getElementSelectorMatchingDescription", () => {
    it("should apply legacy element template data with only description (no moduleDescription) and delegate", () => {
      const result = matcher.getElementSelectorMatchingDescription(
        MOCK_ELEMENT_DESCRIPTION,
        MOCK_ELEMENT_SELECTOR
      );

      expect(mockedGetLegacyElementExtra).toHaveBeenCalledWith(
        MOCK_ELEMENT_DESCRIPTION
      );
      expect(elementsMatcherInstance.getSelectorMatching).toHaveBeenCalledWith(
        MOCK_ELEMENT_DESCRIPTION,
        MOCK_ELEMENT_SELECTOR,
        { extraTemplateData: { ...MOCK_LEGACY_ELEMENT_DATA } }
      );
      expect(result).toBe(MOCK_MATCH_RESULT);
    });

    it("should merge user extraTemplateData over legacy data", () => {
      const userExtra = { custom: "val" };

      matcher.getElementSelectorMatchingDescription(
        MOCK_ELEMENT_DESCRIPTION,
        MOCK_ELEMENT_SELECTOR,
        { extraTemplateData: userExtra }
      );

      expect(elementsMatcherInstance.getSelectorMatching).toHaveBeenCalledWith(
        MOCK_ELEMENT_DESCRIPTION,
        MOCK_ELEMENT_SELECTOR,
        {
          extraTemplateData: { ...MOCK_LEGACY_ELEMENT_DATA, ...userExtra },
        }
      );
    });
  });

  describe("getModuleSelectorMatchingDescription", () => {
    it("should delegate directly to ModulesMatcher.getSelectorMatching with the provided description", () => {
      const options = { source: MOCK_SOURCE };

      const result = matcher.getModuleSelectorMatchingDescription(
        MOCK_MODULE_DESCRIPTION,
        MOCK_MODULE_SELECTOR,
        options
      );

      expect(modulesMatcherInstance.getSelectorMatching).toHaveBeenCalledWith(
        MOCK_MODULE_DESCRIPTION,
        MOCK_MODULE_SELECTOR,
        options
      );
      expect(result).toBe(MOCK_MATCH_RESULT);
    });

    it("should not apply any legacy template data enrichment", () => {
      matcher.getModuleSelectorMatchingDescription(
        MOCK_MODULE_DESCRIPTION,
        MOCK_MODULE_SELECTOR
      );

      expect(mockedGetLegacyElementExtra).not.toHaveBeenCalled();
      expect(mockedGetLegacyEntityExtra).not.toHaveBeenCalled();
      expect(mockedGetLegacyDependencyExtra).not.toHaveBeenCalled();
    });

    it("should pass options through unchanged", () => {
      const options = {
        source: MOCK_SOURCE,
        extraTemplateData: { custom: "value" },
      };

      matcher.getModuleSelectorMatchingDescription(
        MOCK_MODULE_DESCRIPTION,
        MOCK_MODULE_SELECTOR,
        options
      );

      expect(modulesMatcherInstance.getSelectorMatching).toHaveBeenCalledWith(
        MOCK_MODULE_DESCRIPTION,
        MOCK_MODULE_SELECTOR,
        options
      );
    });
  });

  describe("clearCache", () => {
    it("should delegate to Descriptors.clearCache", () => {
      matcher.clearCache();

      expect(descriptorsInstance.clearCache).toHaveBeenCalledTimes(1);
    });
  });

  describe("serializeCache", () => {
    it("should return an object wrapping Descriptors.serializeCache under the descriptors key", () => {
      const result = matcher.serializeCache();

      expect(descriptorsInstance.serializeCache).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        descriptors: MOCK_SERIALIZED_DESCRIPTORS_CACHE,
      });
    });
  });

  describe("setCacheFromSerialized", () => {
    it("should delegate to Descriptors.setCacheFromSerialized with the descriptors portion", () => {
      matcher.setCacheFromSerialized({
        descriptors: MOCK_SERIALIZED_DESCRIPTORS_CACHE,
      });

      expect(descriptorsInstance.setCacheFromSerialized).toHaveBeenCalledWith(
        MOCK_SERIALIZED_DESCRIPTORS_CACHE
      );
    });
  });
});
