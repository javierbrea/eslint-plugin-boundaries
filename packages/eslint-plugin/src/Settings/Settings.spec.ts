jest.mock("../Debug", () => ({
  warnOnce: jest.fn(),
}));

import { isAbsolute, resolve } from "path";

import type { ElementDescriptor } from "@boundaries/elements";
import { ELEMENT_DESCRIPTOR_MODES_MAP } from "@boundaries/elements";
import type { Rule } from "eslint";

import { warnOnce } from "../Debug";
import {
  CACHE_DEFAULT,
  DEPENDENCY_NODE_KEYS_MAP,
  DISABLE_LEGACY_WARNINGS_DEFAULT,
  ELEMENTS_SINGLE_TYPE_DEFAULT,
  LEGACY_TEMPLATES_DEFAULT,
  SETTINGS,
  SETTINGS_KEYS_MAP,
} from "../Shared/Settings.types";

import {
  deprecateAlias,
  deprecateTypes,
  getSettings,
  isDependencyNodeKey,
  isLegacyElementDescriptorType,
  isSettingsKey,
  isValidDependencyNodeSelector,
  transformLegacyTypes,
  validateDebugDependenciesFilter,
  validateDebugFilesFilter,
  validateDebugFilterSelectors,
} from "./Settings";

const mockedWarnOnce = jest.mocked(warnOnce);

function buildContext(settings: Record<string, unknown>): Rule.RuleContext {
  return { settings } as unknown as Rule.RuleContext;
}

const validElementDescriptor = { pattern: "src/services/*", type: "service" };
const invalidElementDescriptor = { pattern: "src/**/*.ts" };
const validFileDescriptor = { pattern: "src/**", category: "component" };
const invalidFileDescriptor = { pattern: "src/**" };

describe("Settings/Settings", () => {
  let cwdSpy: jest.SpyInstance<string, []>;

  beforeEach(() => {
    mockedWarnOnce.mockClear();
    delete process.env[SETTINGS.ENV_ROOT_PATH];
    cwdSpy = jest.spyOn(process, "cwd").mockReturnValue("/repo");
  });

  afterEach(() => {
    cwdSpy.mockRestore();
  });

  describe("isSettingsKey", () => {
    it("returns true for a known settings key", () => {
      expect(isSettingsKey(SETTINGS_KEYS_MAP.ELEMENTS)).toBe(true);
    });

    it("returns false for an unknown string", () => {
      expect(isSettingsKey("boundaries/unknown")).toBe(false);
    });

    it("returns false for a non-string value", () => {
      expect(isSettingsKey(42)).toBe(false);
    });
  });

  describe("isDependencyNodeKey", () => {
    it("returns true for a known dependency node key", () => {
      expect(isDependencyNodeKey(DEPENDENCY_NODE_KEYS_MAP.IMPORT)).toBe(true);
    });

    it("returns false for an unknown string", () => {
      expect(isDependencyNodeKey("not-a-key")).toBe(false);
    });

    it("returns false for a non-string value", () => {
      expect(isDependencyNodeKey({})).toBe(false);
    });
  });

  describe("isLegacyElementDescriptorType", () => {
    it("returns true for a string", () => {
      expect(isLegacyElementDescriptorType("legacy")).toBe(true);
    });

    it("returns false for an object", () => {
      expect(isLegacyElementDescriptorType({ type: "legacy" })).toBe(false);
    });
  });

  describe("transformLegacyTypes", () => {
    it("returns an empty array when input is undefined", () => {
      expect(transformLegacyTypes()).toEqual([]);
    });

    it("transforms string entries into element descriptor objects", () => {
      expect(transformLegacyTypes(["service"])).toEqual([
        {
          type: "service",
          match: ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
          pattern: "service/*",
          capture: ["elementName"],
        },
      ]);
    });

    it("fills the default match for object entries that omit it", () => {
      expect(
        transformLegacyTypes([{ type: "service", pattern: "service/**" }])
      ).toEqual([
        {
          type: "service",
          pattern: "service/**",
          match: ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
        },
      ]);
    });

    it("preserves the provided match for object entries", () => {
      expect(
        transformLegacyTypes([
          {
            type: "service",
            pattern: "service/**",
            match: "full",
          } as unknown as ElementDescriptor,
        ])
      ).toEqual([{ type: "service", pattern: "service/**", match: "full" }]);
    });
  });

  describe("isValidDependencyNodeSelector", () => {
    it("returns true for a selector with a name and explicit kind", () => {
      expect(
        isValidDependencyNodeSelector({
          selector: "CallExpression",
          kind: "value",
          name: "custom",
        })
      ).toBe(true);
      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("returns true and warns when a valid selector omits the name", () => {
      expect(
        isValidDependencyNodeSelector({
          selector: "CallExpression",
          kind: "value",
        })
      ).toBe(true);
      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining(`"name"`),
        expect.any(String)
      );
    });

    it("returns false and warns when the value is not an object", () => {
      expect(isValidDependencyNodeSelector("not-an-object")).toBe(false);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining(SETTINGS.ADDITIONAL_DEPENDENCY_NODES),
        expect.any(String)
      );
    });

    it("returns false when the selector field is missing", () => {
      expect(isValidDependencyNodeSelector({ kind: "value" })).toBe(false);
    });

    it("returns false when kind is invalid", () => {
      expect(
        isValidDependencyNodeSelector({
          selector: "CallExpression",
          kind: "invalid",
        })
      ).toBe(false);
    });

    it("returns false when name is not a string", () => {
      expect(
        isValidDependencyNodeSelector({
          selector: "CallExpression",
          kind: "value",
          name: 1,
        })
      ).toBe(false);
    });
  });

  describe("deprecateTypes", () => {
    it("does not warn when the value is falsy", () => {
      deprecateTypes(undefined, false);
      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("warns when the value is truthy", () => {
      deprecateTypes([validElementDescriptor], false);
      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining(SETTINGS.TYPES),
        expect.stringContaining(SETTINGS.ELEMENTS)
      );
    });
  });

  describe("deprecateAlias", () => {
    it("does not warn when the value is falsy", () => {
      deprecateAlias(undefined, false);
      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("warns when the value is truthy", () => {
      deprecateAlias({ "@components": "src/components" }, false);
      expect(mockedWarnOnce).toHaveBeenCalledTimes(1);
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining(SETTINGS.ALIAS),
        expect.stringContaining("import/resolver")
      );
    });
  });

  describe("validateDebugFilterSelectors", () => {
    it("returns undefined when value is undefined", () => {
      expect(validateDebugFilterSelectors(undefined, "files")).toBeUndefined();
      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });

    it("normalizes entity selectors for the 'files' filter", () => {
      const result = validateDebugFilterSelectors(
        { file: { categories: "util" } },
        "files"
      );
      expect(result).toBeDefined();
    });

    it("normalizes file selectors for the 'files' filter", () => {
      const result = validateDebugFilterSelectors(
        { categories: "components" },
        "files"
      );
      expect(result).toBeDefined();
    });

    it("warns and returns undefined for an invalid value", () => {
      const result = validateDebugFilterSelectors(
        "not-a-selector",
        "dependencies"
      );
      expect(result).toBeUndefined();
      expect(mockedWarnOnce).toHaveBeenCalledWith(
        expect.stringContaining("dependencies"),
        expect.any(String)
      );
    });
  });

  describe("validateDebugFilesFilter", () => {
    it("delegates to validateDebugFilterSelectors with 'files'", () => {
      const result = validateDebugFilesFilter({ categories: "components" });
      expect(result).toBeDefined();
    });

    it("returns undefined for undefined input", () => {
      expect(validateDebugFilesFilter(undefined)).toBeUndefined();
    });
  });

  describe("validateDebugDependenciesFilter", () => {
    it("normalizes a valid dependency selector", () => {
      const result = validateDebugDependenciesFilter({
        to: { element: { type: "" } },
      });
      expect(result).toBeDefined();
    });

    it("returns undefined for an invalid dependency selector without warning", () => {
      expect(validateDebugDependenciesFilter({})).toBeUndefined();
      expect(mockedWarnOnce).not.toHaveBeenCalled();
    });
  });

  describe("getSettings", () => {
    it("caches the normalized settings per context.settings reference", () => {
      const context = buildContext({
        [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
      });

      const first = getSettings(context);
      const second = getSettings(context);

      expect(first).toBe(second);
    });

    describe("elementDescriptors", () => {
      it("returns an empty array when no element descriptors are provided", () => {
        const result = getSettings(buildContext({}));

        expect(result.elementDescriptors).toEqual([]);
      });

      it("does not warn about missing element descriptors when file descriptors are provided", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
          })
        );

        expect(mockedWarnOnce).not.toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.ELEMENTS),
          expect.any(String)
        );
      });

      it("falls back to the deprecated 'types' setting and warns about deprecation", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.TYPES]: ["service"],
          })
        );

        expect(result.elementDescriptors).toEqual([
          {
            type: "service",
            pattern: "service/*",
            match: ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
            capture: ["elementName"],
          },
        ]);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.TYPES),
          expect.stringContaining(SETTINGS.ELEMENTS)
        );
      });

      it("filters invalid descriptors and warns about them", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [
              validElementDescriptor,
              invalidElementDescriptor,
            ],
          })
        );

        expect(result.elementDescriptors).toHaveLength(1);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("invalid"),
          expect.stringContaining(
            JSON.stringify([
              {
                match: ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
                ...invalidElementDescriptor,
              },
            ])
          )
        );
      });

      it("warns when any element descriptor uses the deprecated 'mode' option", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [
              { ...validElementDescriptor, mode: "folder" },
            ],
          })
        );

        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("deprecated"),
          expect.stringContaining("partialMatch")
        );
      });

      it("warns when any element descriptor uses the deprecated 'category' option", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [
              { ...validElementDescriptor, category: "domain" },
            ],
          })
        );

        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("'category' option in element descriptors"),
          expect.stringContaining(SETTINGS_KEYS_MAP.FILES)
        );
      });

      it("does not warn about deprecated 'category' option when no descriptor uses it", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(mockedWarnOnce).not.toHaveBeenCalledWith(
          expect.stringContaining("'category' option in element descriptors"),
          expect.any(String)
        );
      });

      it("warns that mode has no effect when partialMatch is false", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [
              {
                ...validElementDescriptor,
                mode: "full",
                partialMatch: false,
              },
            ],
          })
        );

        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("no effect"),
          expect.stringContaining("mode")
        );
      });

      it("warns when an element descriptor uses a file-like pattern in folder mode", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [
              { pattern: "components/**/*.ts", type: "component" },
            ],
          })
        );

        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("file patterns"),
          expect.stringContaining("folders")
        );
      });

      it("does not warn about file-like patterns when the pattern has no extension in the last segment", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [
              { pattern: "components/*", type: "component" },
            ],
          })
        );

        expect(mockedWarnOnce).not.toHaveBeenCalledWith(
          expect.stringContaining("file patterns"),
          expect.any(String)
        );
      });
    });

    describe("fileDescriptors", () => {
      it("returns an empty array when not provided", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(result.fileDescriptors).toEqual([]);
      });

      it("returns an empty array when value is not an array", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.FILES]: "invalid",
          })
        );

        expect(result.fileDescriptors).toEqual([]);
      });

      it("keeps all valid file descriptors without warning about invalid ones", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
          })
        );

        expect(result.fileDescriptors).toEqual([validFileDescriptor]);
        expect(mockedWarnOnce).not.toHaveBeenCalledWith(
          expect.stringContaining("file descriptors"),
          expect.any(String)
        );
      });

      it("filters invalid file descriptors and warns about them", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.FILES]: [
              validFileDescriptor,
              invalidFileDescriptor,
            ],
          })
        );

        expect(result.fileDescriptors).toHaveLength(1);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("file descriptors"),
          expect.stringContaining(JSON.stringify([invalidFileDescriptor]))
        );
      });
    });

    describe("classification layers", () => {
      it("warns when neither element nor file descriptors are provided", () => {
        getSettings(buildContext({}));

        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.ELEMENTS),
          expect.any(String)
        );
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.FILES),
          expect.any(String)
        );
      });

      it("does not warn when only element descriptors are provided", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(mockedWarnOnce).not.toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.FILES),
          expect.any(String)
        );
      });

      it("does not warn when only file descriptors are provided", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
          })
        );

        expect(mockedWarnOnce).not.toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.ELEMENTS),
          expect.any(String)
        );
      });
    });

    describe("dependencyNodes", () => {
      it("expands default dependency nodes when not provided", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        const expectedCount =
          SETTINGS.DEFAULT_DEPENDENCY_NODES[DEPENDENCY_NODE_KEYS_MAP.IMPORT]
            .length +
          SETTINGS.DEFAULT_DEPENDENCY_NODES[DEPENDENCY_NODE_KEYS_MAP.EXPORT]
            .length +
          SETTINGS.DEFAULT_DEPENDENCY_NODES[DEPENDENCY_NODE_KEYS_MAP.REQUIRE]
            .length +
          SETTINGS.DEFAULT_DEPENDENCY_NODES[
            DEPENDENCY_NODE_KEYS_MAP.DYNAMIC_IMPORT
          ].length;
        expect(result.dependencyNodes).toHaveLength(expectedCount);
      });

      it("warns and returns an empty list when the value is not an array", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: "invalid",
          })
        );

        expect(result.dependencyNodes).toEqual([]);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.DEPENDENCY_NODES),
          expect.any(String)
        );
      });

      it("expands only the requested valid keys", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [
              DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
            ],
          })
        );

        expect(result.dependencyNodes).toEqual(
          SETTINGS.DEFAULT_DEPENDENCY_NODES[DEPENDENCY_NODE_KEYS_MAP.REQUIRE]
        );
      });

      it("warns about invalid keys and filters them out", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [
              DEPENDENCY_NODE_KEYS_MAP.IMPORT,
              "bogus",
            ],
          })
        );

        expect(result.dependencyNodes).toEqual(
          SETTINGS.DEFAULT_DEPENDENCY_NODES[DEPENDENCY_NODE_KEYS_MAP.IMPORT]
        );
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.DEPENDENCY_NODES),
          expect.stringContaining("bogus")
        );
      });
    });

    describe("additionalDependencyNodes", () => {
      it("returns an empty array when not provided", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [],
          })
        );

        expect(result.dependencyNodes).toEqual([]);
      });

      it("warns and returns an empty array when the value is not an array", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [],
            [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]: "invalid",
          })
        );

        expect(result.dependencyNodes).toEqual([]);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.ADDITIONAL_DEPENDENCY_NODES),
          expect.any(String)
        );
      });

      it("merges valid additional nodes after the default ones", () => {
        const additional = {
          selector: "CallExpression",
          kind: "value" as const,
          name: "custom",
        };
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [
              DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
            ],
            [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]: [additional],
          })
        );

        expect(result.dependencyNodes).toEqual([
          ...SETTINGS.DEFAULT_DEPENDENCY_NODES[
            DEPENDENCY_NODE_KEYS_MAP.REQUIRE
          ],
          additional,
        ]);
      });

      it("filters invalid additional nodes and warns about them", () => {
        const valid = {
          selector: "CallExpression",
          kind: "value" as const,
          name: "custom",
        };
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [],
            [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]: [
              valid,
              { kind: "value" },
            ],
          })
        );

        expect(result.dependencyNodes).toEqual([valid]);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.ADDITIONAL_DEPENDENCY_NODES),
          expect.stringContaining(JSON.stringify([{ kind: "value" }]))
        );
      });
    });

    describe("ignorePaths and includePaths", () => {
      it("returns undefined when not provided", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(result.ignorePaths).toBeUndefined();
        expect(result.includePaths).toBeUndefined();
      });

      it("wraps a string into an array", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.IGNORE]: "src/skip/**",
            [SETTINGS_KEYS_MAP.INCLUDE]: "src/keep/**",
          })
        );

        expect(result.ignorePaths).toEqual(["src/skip/**"]);
        expect(result.includePaths).toEqual(["src/keep/**"]);
      });

      it("preserves arrays of strings", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.IGNORE]: ["a", "b"],
            [SETTINGS_KEYS_MAP.INCLUDE]: ["c", "d"],
          })
        );

        expect(result.ignorePaths).toEqual(["a", "b"]);
        expect(result.includePaths).toEqual(["c", "d"]);
      });

      it("warns and returns undefined for invalid values", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.IGNORE]: ["a", 1],
            [SETTINGS_KEYS_MAP.INCLUDE]: ["c", 2],
          })
        );

        expect(result.ignorePaths).toBeUndefined();
        expect(result.includePaths).toBeUndefined();
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.IGNORE),
          expect.any(String)
        );
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.INCLUDE),
          expect.any(String)
        );
      });
    });

    describe("legacyTemplates, elementsSingleType and cache", () => {
      it("applies defaults when undefined", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(result.legacyTemplates).toBe(LEGACY_TEMPLATES_DEFAULT);
        expect(result.elementsSingleType).toBe(ELEMENTS_SINGLE_TYPE_DEFAULT);
        expect(result.cache).toBe(CACHE_DEFAULT);
      });

      it("preserves boolean values", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: false,
            [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]: false,
            [SETTINGS_KEYS_MAP.CACHE]: false,
          })
        );

        expect(result.legacyTemplates).toBe(false);
        expect(result.elementsSingleType).toBe(false);
        expect(result.cache).toBe(false);
      });

      it("warns and falls back to defaults for non-boolean values", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: "yes",
            [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]: "no",
            [SETTINGS_KEYS_MAP.CACHE]: "maybe",
          })
        );

        expect(result.legacyTemplates).toBe(LEGACY_TEMPLATES_DEFAULT);
        expect(result.elementsSingleType).toBe(ELEMENTS_SINGLE_TYPE_DEFAULT);
        expect(result.cache).toBe(CACHE_DEFAULT);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.LEGACY_TEMPLATES),
          expect.stringContaining("boolean")
        );
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE),
          expect.stringContaining("boolean")
        );
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.CACHE),
          expect.stringContaining("boolean")
        );
      });

      it("warns about deprecation when legacyTemplates is explicitly true", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: true,
          })
        );

        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(
            `'${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting is deprecated`
          ),
          expect.stringContaining("{{...}}")
        );
      });

      it("does not warn about deprecation when legacyTemplates is undefined", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(mockedWarnOnce).not.toHaveBeenCalledWith(
          expect.stringContaining(
            `'${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting is deprecated`
          ),
          expect.any(String)
        );
      });

      it("does not warn about deprecation when legacyTemplates is explicitly false", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: false,
          })
        );

        expect(mockedWarnOnce).not.toHaveBeenCalledWith(
          expect.stringContaining(
            `'${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting is deprecated`
          ),
          expect.any(String)
        );
      });
    });

    describe("flagAsExternal", () => {
      const defaults = {
        unresolvableAlias: true,
        inNodeModules: true,
        outsideRootPath: false,
        customSourcePatterns: [],
      };

      it("returns the defaults when not provided", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(result.flagAsExternal).toEqual(defaults);
      });

      it("warns and returns the defaults when the value is not an object", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: "invalid",
          })
        );

        expect(result.flagAsExternal).toEqual(defaults);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL),
          expect.stringContaining("object")
        );
      });

      it("applies provided boolean overrides and custom source patterns", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: {
              unresolvableAlias: false,
              inNodeModules: false,
              outsideRootPath: true,
              customSourcePatterns: ["^@scope/"],
            },
          })
        );

        expect(result.flagAsExternal).toEqual({
          unresolvableAlias: false,
          inNodeModules: false,
          outsideRootPath: true,
          customSourcePatterns: ["^@scope/"],
        });
      });

      it("keeps the defaults when the object omits all known fields", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: {},
          })
        );

        expect(result.flagAsExternal).toEqual(defaults);
        expect(mockedWarnOnce).toHaveBeenCalledTimes(1); // performance tip only
      });

      it("warns once per invalid field and keeps defaults for the bad ones", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: {
              unresolvableAlias: "yes",
              inNodeModules: "no",
              outsideRootPath: "maybe",
              customSourcePatterns: [1, 2],
            },
          })
        );

        expect(result.flagAsExternal).toEqual(defaults);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("unresolvableAlias"),
          expect.any(String)
        );
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("inNodeModules"),
          expect.any(String)
        );
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("outsideRootPath"),
          expect.any(String)
        );
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("customSourcePatterns"),
          expect.any(String)
        );
      });
    });

    describe("debug", () => {
      const defaults = {
        enabled: false,
        filter: { files: undefined, dependencies: undefined },
        messages: { files: true, dependencies: true, violations: true },
      };

      it("returns defaults when not provided", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(result.debug).toEqual(defaults);
      });

      it("warns and returns defaults when the value is not an object", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEBUG]: "invalid",
          })
        );

        expect(result.debug).toEqual(defaults);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.DEBUG),
          expect.stringContaining("object")
        );
      });

      it("accepts a boolean for 'enabled'", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEBUG]: { enabled: true },
          })
        );

        expect(result.debug.enabled).toBe(true);
      });

      it("warns and falls back to default when 'enabled' is not a boolean", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEBUG]: { enabled: "yes" },
          })
        );

        expect(result.debug.enabled).toBe(false);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("enabled"),
          expect.any(String)
        );
      });

      it("warns and returns default messages when 'messages' is not an object", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEBUG]: { messages: "invalid" },
          })
        );

        expect(result.debug.messages).toEqual(defaults.messages);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("messages"),
          expect.any(String)
        );
      });

      it("returns default flags when 'messages' is an object with no known fields", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEBUG]: { messages: {} },
          })
        );

        expect(result.debug.messages).toEqual(defaults.messages);
        expect(mockedWarnOnce).toHaveBeenCalledTimes(1); // performance tip only
      });

      it("applies partial 'messages' overrides and warns about invalid flags", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEBUG]: {
              messages: {
                files: false,
                dependencies: "invalid",
              },
            },
          })
        );

        expect(result.debug.messages).toEqual({
          files: false,
          dependencies: true,
          violations: true,
        });
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("messages.dependencies"),
          expect.any(String)
        );
      });

      it("warns and returns default filter when 'filter' is not an object", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEBUG]: { filter: "invalid" },
          })
        );

        expect(result.debug.filter).toEqual(defaults.filter);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("filter"),
          expect.any(String)
        );
      });

      it("normalizes valid filter entries", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DEBUG]: {
              filter: {
                files: { categories: "components" },
                dependencies: { to: { element: { type: "" } } },
              },
            },
          })
        );

        expect(result.debug.filter.files).toBeDefined();
        expect(result.debug.filter.dependencies).toBeDefined();
      });
    });

    describe("rootPath", () => {
      it("returns process.cwd() when no setting and no env var are provided", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(result.rootPath).toBe("/repo");
      });

      it("returns an absolute user setting unchanged", () => {
        const absolute = isAbsolute("/abs/path") ? "/abs/path" : "/abs/path";
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.ROOT_PATH]: absolute,
          })
        );

        expect(result.rootPath).toBe(absolute);
      });

      it("resolves a relative user setting against process.cwd()", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.ROOT_PATH]: "relative/path",
          })
        );

        expect(result.rootPath).toBe(resolve("/repo", "relative/path"));
      });

      it("uses the environment variable when set and absolute", () => {
        process.env[SETTINGS.ENV_ROOT_PATH] = "/from/env";

        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.ROOT_PATH]: "/from/setting",
          })
        );

        expect(result.rootPath).toBe("/from/env");
      });

      it("resolves a relative env var against cwd when a user setting is present", () => {
        process.env[SETTINGS.ENV_ROOT_PATH] = "env/relative";

        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.ROOT_PATH]: "/from/setting",
          })
        );

        expect(result.rootPath).toBe(resolve("/repo", "env/relative"));
      });

      it("warns and falls back to cwd when only the env var is set with a relative path", () => {
        process.env[SETTINGS.ENV_ROOT_PATH] = "env/relative";

        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(result.rootPath).toBe("/repo");
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.ROOT_PATH),
          expect.stringContaining("string")
        );
      });
    });

    describe("disableLegacyWarnings", () => {
      it("returns false by default when the setting is absent", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(result.disableLegacyWarnings).toBe(
          DISABLE_LEGACY_WARNINGS_DEFAULT
        );
        expect(result.disableLegacyWarnings).toBe(false);
      });

      it("returns true when explicitly set to true", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DISABLE_LEGACY_WARNINGS]: true,
          })
        );

        expect(result.disableLegacyWarnings).toBe(true);
      });

      it("warns and returns false when the value is not a boolean", () => {
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DISABLE_LEGACY_WARNINGS]: "yes",
          })
        );

        expect(result.disableLegacyWarnings).toBe(false);
        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.DISABLE_LEGACY_WARNINGS),
          expect.stringContaining("boolean")
        );
      });

      it("skips all legacy deprecation warnings when set to true with boundaries/types", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.TYPES]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DISABLE_LEGACY_WARNINGS]: true,
          })
        );

        const calls = mockedWarnOnce.mock.calls.map((c) => c[0]);
        expect(calls.some((m) => m.includes(SETTINGS.TYPES))).toBe(false);
      });

      it("skips all legacy deprecation warnings when set to true with boundaries/alias", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.ALIAS]: { "@comp": "src/components" },
            [SETTINGS_KEYS_MAP.DISABLE_LEGACY_WARNINGS]: true,
          })
        );

        const calls = mockedWarnOnce.mock.calls.map((c) => c[0]);
        expect(calls.some((m) => m.includes(SETTINGS.ALIAS))).toBe(false);
      });

      it("skips all legacy deprecation warnings when set to true with legacyTemplates: true", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: true,
            [SETTINGS_KEYS_MAP.DISABLE_LEGACY_WARNINGS]: true,
          })
        );

        const calls = mockedWarnOnce.mock.calls.map((c) => c[0]);
        expect(
          calls.some((m) => m.includes(SETTINGS_KEYS_MAP.LEGACY_TEMPLATES))
        ).toBe(false);
      });

      it("skips the mode deprecation .some() check when set to true with deprecated mode in element descriptors", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [
              { ...validElementDescriptor, mode: "folder" },
            ],
            [SETTINGS_KEYS_MAP.DISABLE_LEGACY_WARNINGS]: true,
          })
        );

        const calls = mockedWarnOnce.mock.calls.map((c) => c[0]);
        expect(calls.some((m) => m.includes("mode"))).toBe(false);
      });

      it("emits the performance tip when disableLegacyWarnings is false, even without legacy patterns", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          })
        );

        expect(mockedWarnOnce).toHaveBeenCalledWith(
          expect.stringContaining("Performance tip"),
          expect.stringContaining(SETTINGS_KEYS_MAP.DISABLE_LEGACY_WARNINGS)
        );
      });

      it("emits the performance tip when legacy patterns are present and disableLegacyWarnings is false", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.TYPES]: [validElementDescriptor],
          })
        );

        const calls = mockedWarnOnce.mock.calls.map((c) => c[0]);
        expect(calls.some((m) => m.includes("Performance tip"))).toBe(true);
      });

      it("does not emit the performance tip when disableLegacyWarnings is true", () => {
        getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.TYPES]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.DISABLE_LEGACY_WARNINGS]: true,
          })
        );

        const calls = mockedWarnOnce.mock.calls.map((c) => c[0]);
        expect(calls.some((m) => m.includes("Performance tip"))).toBe(false);
      });
    });
  });
});
