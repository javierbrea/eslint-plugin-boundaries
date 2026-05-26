import type { MatchersOptionsNormalized } from "../../Config";
import type { EntityDescription } from "../../Descriptor";
import type { ElementDescription } from "../../Descriptor/Element/ElementDescription.types";
import type { FileDescription } from "../../Descriptor/File/FileDescription.types";
import type { ModuleDescription } from "../../Descriptor/Module/ModuleDescription.types";
import type { ElementsMatcher } from "../Element";
import type { ElementSingleSelectorMatchResult } from "../Element/ElementMatcher.types";
import type { FilesMatcher, FileSingleSelector } from "../File";
import type { ModulesMatcher, ModuleSingleSelector } from "../Module";
import type { Micromatch } from "../Shared";

import { EntitiesMatcher } from "./EntityMatcher";
import type { EntitySingleSelectorNormalized } from "./EntitySelector.types";
import { normalizeEntitySelector } from "./EntitySelectorHelpers";

jest.mock("./EntitySelectorHelpers");
jest.mock("../Shared/Micromatch");

const mockedNormalizeEntitySelector = jest.mocked(normalizeEntitySelector);

describe("EntitiesMatcher", () => {
  const MOCK_CONFIG: MatchersOptionsNormalized = { legacyTemplates: false };

  let micromatch: jest.Mocked<Micromatch>;
  let mockElementsMatcher: jest.Mocked<ElementsMatcher>;
  let mockFilesMatcher: jest.Mocked<FilesMatcher>;
  let mockModulesMatcher: jest.Mocked<ModulesMatcher>;
  let matcher: EntitiesMatcher;

  beforeEach(() => {
    jest.clearAllMocks();
    micromatch = {
      isMatch: jest.fn(),
    } as unknown as jest.Mocked<Micromatch>;
    mockElementsMatcher = {
      getSelectorMatching: jest.fn(),
    } as unknown as jest.Mocked<ElementsMatcher>;
    mockFilesMatcher = {
      getSelectorMatching: jest.fn(),
    } as unknown as jest.Mocked<FilesMatcher>;
    mockModulesMatcher = {
      getSelectorMatching: jest.fn(),
    } as unknown as jest.Mocked<ModulesMatcher>;
    matcher = new EntitiesMatcher(
      mockElementsMatcher,
      mockFilesMatcher,
      mockModulesMatcher,
      MOCK_CONFIG,
      micromatch
    );
  });

  function createElementDescription(
    overrides: Partial<ElementDescription> = {}
  ): ElementDescription {
    return {
      path: "/src/components/Button.ts",
      captured: null,
      isIgnored: false,
      isUnknown: false,
      types: ["component"],
      category: null,
      filePath: null,
      fileInternalPath: null,
      parent: null,
      ...overrides,
    };
  }

  function createFileDescription(
    overrides: Partial<FileDescription> = {}
  ): FileDescription {
    return {
      path: "/src/components/Button.ts",
      captured: null,
      isIgnored: false,
      isUnknown: false,
      categories: null,
      ...overrides,
    };
  }

  function createModuleDescription(
    overrides: Partial<ModuleDescription> = {}
  ): ModuleDescription {
    return {
      origin: "local",
      source: null,
      internalPath: null,
      ...overrides,
    };
  }

  function createEntityDescription(
    overrides: Partial<EntityDescription> = {}
  ): EntityDescription {
    return {
      element: createElementDescription(),
      file: createFileDescription(),
      module: createModuleDescription(),
      ...overrides,
    };
  }

  describe("constructor", () => {
    it("should create an instance of EntitiesMatcher", () => {
      expect(matcher).toBeInstanceOf(EntitiesMatcher);
    });
  });

  describe("getSelectorMatching", () => {
    it("should normalize the selector", () => {
      const entity = createEntityDescription();
      const selector = { element: [{ type: "component" }] };
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "component" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue({
        type: "component",
      });

      matcher.getSelectorMatching(entity, selector);

      expect(mockedNormalizeEntitySelector).toHaveBeenCalledWith(selector);
    });

    it("should return match result when element selector matches", () => {
      const entity = createEntityDescription();
      const elementSelector = [{ type: "component" }];
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: elementSelector },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      const elementMatchResult: ElementSingleSelectorMatchResult = {
        type: "component",
      };
      mockElementsMatcher.getSelectorMatching.mockReturnValue(
        elementMatchResult
      );

      const result = matcher.getSelectorMatching(entity, {
        element: elementSelector,
      });

      expect(result).toEqual({ element: elementMatchResult });
    });

    it("should return match result when file selector matches", () => {
      const entity = createEntityDescription();
      const fileSelector = [{ filePath: "**/*.ts" }];
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { file: fileSelector },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      const fileMatchResult: FileSingleSelector = { filePath: "**/*.ts" };
      mockFilesMatcher.getSelectorMatching.mockReturnValue(fileMatchResult);

      const result = matcher.getSelectorMatching(entity, {
        file: fileSelector,
      });

      expect(result).toEqual({ file: fileMatchResult });
    });

    it("should return match result when module selector matches", () => {
      const entity = createEntityDescription();
      const moduleSelector = [{ origin: "local" as const }];
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { module: moduleSelector },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      const moduleMatchResult: ModuleSingleSelector = { origin: "local" };
      mockModulesMatcher.getSelectorMatching.mockReturnValue(moduleMatchResult);

      const result = matcher.getSelectorMatching(entity, {
        module: moduleSelector,
      });

      expect(result).toEqual({ module: moduleMatchResult });
    });

    it("should return combined match result when all selectors match", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        {
          element: [{ type: "component" }],
          file: [{ filePath: "**/*.ts" }],
          module: [{ origin: "local" }],
        },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      const elementMatchResult: ElementSingleSelectorMatchResult = {
        type: "component",
      };
      const fileMatchResult: FileSingleSelector = { filePath: "**/*.ts" };
      const moduleMatchResult: ModuleSingleSelector = { origin: "local" };
      mockElementsMatcher.getSelectorMatching.mockReturnValue(
        elementMatchResult
      );
      mockFilesMatcher.getSelectorMatching.mockReturnValue(fileMatchResult);
      mockModulesMatcher.getSelectorMatching.mockReturnValue(moduleMatchResult);

      const result = matcher.getSelectorMatching(entity, {
        element: [{ type: "component" }],
        file: [{ filePath: "**/*.ts" }],
        module: [{ origin: "local" }],
      });

      expect(result).toEqual({
        element: elementMatchResult,
        file: fileMatchResult,
        module: moduleMatchResult,
      });
    });

    it("should return null when element selector does not match", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "helper" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.getSelectorMatching(entity, {
        element: [{ type: "helper" }],
      });

      expect(result).toBeNull();
    });

    it("should return null when file selector does not match", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        {
          element: [{ type: "component" }],
          file: [{ filePath: "**/*.css" }],
        },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue({
        type: "component",
      });
      mockFilesMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.getSelectorMatching(entity, {
        element: [{ type: "component" }],
        file: [{ filePath: "**/*.css" }],
      });

      expect(result).toBeNull();
    });

    it("should return null when module selector does not match", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        {
          element: [{ type: "component" }],
          module: [{ origin: "external" }],
        },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue({
        type: "component",
      });
      mockModulesMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.getSelectorMatching(entity, {
        element: [{ type: "component" }],
        module: [{ origin: "external" }],
      });

      expect(result).toBeNull();
    });

    it("should not call element matcher when element selector is undefined", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { module: [{ origin: "local" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      const moduleMatchResult: ModuleSingleSelector = { origin: "local" };
      mockModulesMatcher.getSelectorMatching.mockReturnValue(moduleMatchResult);

      matcher.getSelectorMatching(entity, { module: [{ origin: "local" }] });

      expect(mockElementsMatcher.getSelectorMatching).not.toHaveBeenCalled();
    });

    it("should not call file matcher when file selector is undefined", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "component" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue({
        type: "component",
      });

      matcher.getSelectorMatching(entity, {
        element: [{ type: "component" }],
      });

      expect(mockFilesMatcher.getSelectorMatching).not.toHaveBeenCalled();
    });

    it("should not call module matcher when module selector is undefined", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "component" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue({
        type: "component",
      });

      matcher.getSelectorMatching(entity, {
        element: [{ type: "component" }],
      });

      expect(mockModulesMatcher.getSelectorMatching).not.toHaveBeenCalled();
    });

    it("should return the first matching selector from multiple", () => {
      const entity = createEntityDescription();
      const firstSelector: EntitySingleSelectorNormalized = {
        element: [{ type: "helper" }],
      };
      const secondSelector: EntitySingleSelectorNormalized = {
        element: [{ type: "component" }],
      };
      mockedNormalizeEntitySelector.mockReturnValue([
        firstSelector,
        secondSelector,
      ]);
      const secondMatchResult: ElementSingleSelectorMatchResult = {
        type: "component",
      };
      mockElementsMatcher.getSelectorMatching
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(secondMatchResult);

      const result = matcher.getSelectorMatching(entity, [
        { element: [{ type: "helper" }] },
        { element: [{ type: "component" }] },
      ]);

      expect(result).toEqual({ element: secondMatchResult });
    });

    it("should return null when no selectors match in array", () => {
      const entity = createEntityDescription();
      const firstSelector: EntitySingleSelectorNormalized = {
        element: [{ type: "helper" }],
      };
      const secondSelector: EntitySingleSelectorNormalized = {
        element: [{ type: "service" }],
      };
      mockedNormalizeEntitySelector.mockReturnValue([
        firstSelector,
        secondSelector,
      ]);
      mockElementsMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.getSelectorMatching(entity, [
        { element: [{ type: "helper" }] },
        { element: [{ type: "service" }] },
      ]);

      expect(result).toBeNull();
    });

    it("should return null when the normalized selectors array is empty", () => {
      const entity = createEntityDescription();
      mockedNormalizeEntitySelector.mockReturnValue([]);

      const result = matcher.getSelectorMatching(entity, []);

      expect(result).toBeNull();
    });

    it("should pass entity data merged with extraTemplateData to element matcher", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "component" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue({
        type: "component",
      });

      matcher.getSelectorMatching(
        entity,
        { element: [{ type: "component" }] },
        {
          extraTemplateData: { element: { customProp: "value" } },
        }
      );

      expect(mockElementsMatcher.getSelectorMatching).toHaveBeenCalledWith(
        entity.element,
        normalizedSelector[0].element,
        {
          extraTemplateData: expect.objectContaining({
            element: expect.objectContaining({ customProp: "value" }),
          }),
        }
      );
    });

    it("should pass entity data merged with extraTemplateData to file matcher", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { file: [{ filePath: "**/*.ts" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockFilesMatcher.getSelectorMatching.mockReturnValue({
        filePath: "**/*.ts",
      });

      matcher.getSelectorMatching(
        entity,
        { file: [{ filePath: "**/*.ts" }] },
        {
          extraTemplateData: { file: { customProp: "value" } },
        }
      );

      expect(mockFilesMatcher.getSelectorMatching).toHaveBeenCalledWith(
        entity.file,
        normalizedSelector[0].file,
        {
          extraTemplateData: expect.objectContaining({
            file: expect.objectContaining({ customProp: "value" }),
          }),
        }
      );
    });

    it("should pass entity data merged with extraTemplateData to module matcher", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { module: [{ origin: "local" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockModulesMatcher.getSelectorMatching.mockReturnValue({
        origin: "local",
      });

      matcher.getSelectorMatching(
        entity,
        { module: [{ origin: "local" }] },
        { extraTemplateData: { module: { customProp: "value" } } }
      );

      expect(mockModulesMatcher.getSelectorMatching).toHaveBeenCalledWith(
        entity.module,
        normalizedSelector[0].module,
        {
          extraTemplateData: expect.objectContaining({
            module: expect.objectContaining({ customProp: "value" }),
          }),
        }
      );
    });

    it("should use default empty extraTemplateData when options are not provided", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "component" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue({
        type: "component",
      });

      matcher.getSelectorMatching(entity, { element: [{ type: "component" }] });

      expect(mockElementsMatcher.getSelectorMatching).toHaveBeenCalledWith(
        entity.element,
        normalizedSelector[0].element,
        {
          extraTemplateData: expect.objectContaining({
            element: entity.element,
          }),
        }
      );
    });

    it("should include entity description data in template data passed to sub-matchers", () => {
      const elementDescription = createElementDescription({
        types: ["component"],
        captured: { myCapture: "capturedValue" },
      });
      const fileDescription = createFileDescription({
        categories: ["source"],
      });
      const moduleDescription = createModuleDescription({
        origin: "external",
        source: "@scope/lib",
      });
      const entity = createEntityDescription({
        element: elementDescription,
        file: fileDescription,
        module: moduleDescription,
      });
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "component" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue({
        type: "component",
      });

      matcher.getSelectorMatching(entity, { element: [{ type: "component" }] });

      expect(mockElementsMatcher.getSelectorMatching).toHaveBeenCalledWith(
        elementDescription,
        normalizedSelector[0].element,
        {
          extraTemplateData: expect.objectContaining({
            element: elementDescription,
            file: fileDescription,
            module: moduleDescription,
          }),
        }
      );
    });

    it("should merge extra template data over entity data for element", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "component" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue({
        type: "component",
      });

      matcher.getSelectorMatching(
        entity,
        { element: [{ type: "component" }] },
        {
          extraTemplateData: {
            element: { types: ["overridden"] },
          },
        }
      );

      expect(mockElementsMatcher.getSelectorMatching).toHaveBeenCalledWith(
        entity.element,
        normalizedSelector[0].element,
        {
          extraTemplateData: expect.objectContaining({
            element: expect.objectContaining({
              types: ["overridden"],
            }),
          }),
        }
      );
    });

    it("should match when selector has no element, file, or module", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [{}];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);

      const result = matcher.getSelectorMatching(entity, {});

      expect(result).toEqual({});
    });

    it("should not include element in result when element matcher returns falsy", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "component" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.getSelectorMatching(entity, {
        element: [{ type: "component" }],
      });

      expect(result).toBeNull();
    });
  });

  describe("isEntityMatch", () => {
    it("should return true when a matching selector is found", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "component" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue({
        type: "component",
      });

      const result = matcher.isEntityMatch(entity, {
        element: [{ type: "component" }],
      });

      expect(result).toBe(true);
    });

    it("should return false when no matching selector is found", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "helper" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.isEntityMatch(entity, {
        element: [{ type: "helper" }],
      });

      expect(result).toBe(false);
    });

    it("should return true when matching against an array of selectors and one matches", () => {
      const entity = createEntityDescription();
      const firstSelector: EntitySingleSelectorNormalized = {
        element: [{ type: "helper" }],
      };
      const secondSelector: EntitySingleSelectorNormalized = {
        element: [{ type: "component" }],
      };
      mockedNormalizeEntitySelector.mockReturnValue([
        firstSelector,
        secondSelector,
      ]);
      mockElementsMatcher.getSelectorMatching
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ type: "component" });

      const result = matcher.isEntityMatch(entity, [
        { element: [{ type: "helper" }] },
        { element: [{ type: "component" }] },
      ]);

      expect(result).toBe(true);
    });

    it("should return false when matching against an array of selectors and none matches", () => {
      const entity = createEntityDescription();
      mockedNormalizeEntitySelector.mockReturnValue([
        { element: [{ type: "helper" }] },
        { element: [{ type: "service" }] },
      ]);
      mockElementsMatcher.getSelectorMatching.mockReturnValue(null);

      const result = matcher.isEntityMatch(entity, [
        { element: [{ type: "helper" }] },
        { element: [{ type: "service" }] },
      ]);

      expect(result).toBe(false);
    });

    it("should pass options through to getSelectorMatching", () => {
      const entity = createEntityDescription();
      const normalizedSelector: EntitySingleSelectorNormalized[] = [
        { element: [{ type: "component" }] },
      ];
      mockedNormalizeEntitySelector.mockReturnValue(normalizedSelector);
      mockElementsMatcher.getSelectorMatching.mockReturnValue({
        type: "component",
      });

      const result = matcher.isEntityMatch(
        entity,
        { element: [{ type: "component" }] },
        { extraTemplateData: { custom: "data" } }
      );

      expect(result).toBe(true);
    });

    it("should return true when selector has no properties", () => {
      const entity = createEntityDescription();
      mockedNormalizeEntitySelector.mockReturnValue([{}]);

      const result = matcher.isEntityMatch(entity, {});

      expect(result).toBe(true);
    });
  });
});
