import type { ElementDescriptor } from "@boundaries/elements";
import { ELEMENT_DESCRIPTOR_MODES_MAP } from "@boundaries/elements";

import { DiagnosticsBuilder } from "../Diagnostics";
import type { Diagnostic } from "../Diagnostics";
import {
  CACHE_DEFAULT,
  DEPENDENCY_NODE_KEYS_MAP,
  ELEMENTS_SINGLE_TYPE_DEFAULT,
  LEGACY_TEMPLATES_DEFAULT,
  LEGACY_WARNINGS_DEFAULT,
  SETTINGS,
  SETTINGS_KEYS_MAP,
} from "../Shared";

import {
  deprecateAlias,
  deprecateTypes,
  isDependencyNodeKey,
  isLegacyElementDescriptorType,
  isSettingsKey,
  isValidDependencyNodeSelector,
  normalizeSettings,
  transformLegacyTypes,
  validateDebugDependenciesFilter,
  validateDebugFilesFilter,
  validateDebugFilterSelectors,
} from "./Settings";

/**
 * Receives the title and the detail of each reported diagnostic, in order, as the ESLint plugin prints them.
 */
const reportedDiagnostic = jest.fn<void, [string, string | undefined]>();

/**
 * Reports diagnostics to `reportedDiagnostic`, in order.
 * @param diagnostics - The diagnostics to report.
 */
function report(diagnostics: Diagnostic[]): void {
  for (const { title, detail } of diagnostics) {
    reportedDiagnostic(title, detail);
  }
}

/**
 * Normalizes settings and reports their diagnostics.
 * @param settings - The settings to normalize.
 * @returns The normalized settings.
 */
function normalize(settings: Record<string, unknown>) {
  const { value, diagnostics } = normalizeSettings(settings);
  report(diagnostics);
  return value;
}

/**
 * Normalizes settings and returns only their diagnostics.
 * @param settings - The settings to normalize.
 * @returns The diagnostics.
 */
function diagnosticsOf(settings: Record<string, unknown>): Diagnostic[] {
  return normalizeSettings(settings).diagnostics;
}

const SETTINGS_INFO = "More info: https://www.jsboundaries.dev/docs/settings/";
// cspell:ignore partialmatch -- documentation anchor for the partialMatch option
const ELEMENTS_INFO =
  "More info: https://www.jsboundaries.dev/docs/classification/elements/#partialmatch-optional";

const validElementDescriptor = { pattern: "src/services/*", type: "service" };
const invalidElementDescriptor = { pattern: "src/**/*.ts" };
const validFileDescriptor = { pattern: "src/**", category: "component" };
const invalidFileDescriptor = { pattern: "src/**" };

describe("Settings/Settings", () => {
  let diagnostics: DiagnosticsBuilder;

  beforeEach(() => {
    reportedDiagnostic.mockClear();
    diagnostics = new DiagnosticsBuilder();
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
        isValidDependencyNodeSelector(
          {
            selector: "CallExpression",
            kind: "value",
            name: "custom",
          },
          diagnostics,
          []
        )
      ).toBe(true);
      expect(diagnostics.build()).toEqual([]);
    });

    it("returns false and warns when the selector omits the name", () => {
      expect(
        isValidDependencyNodeSelector(
          {
            selector: "CallExpression",
            kind: "value",
          },
          diagnostics,
          [SETTINGS.ADDITIONAL_DEPENDENCY_NODES, 0]
        )
      ).toBe(false);

      report(diagnostics.build());

      expect(diagnostics.build()[0].paths).toEqual([
        [SETTINGS.ADDITIONAL_DEPENDENCY_NODES, 0],
      ]);
      expect(reportedDiagnostic).toHaveBeenCalledTimes(1);
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining(SETTINGS.ADDITIONAL_DEPENDENCY_NODES),
        expect.any(String)
      );
    });

    it("returns false when name is an empty string", () => {
      expect(
        isValidDependencyNodeSelector(
          {
            selector: "CallExpression",
            kind: "value",
            name: "",
          },
          diagnostics,
          []
        )
      ).toBe(false);
    });

    it("returns false when name is only whitespace", () => {
      expect(
        isValidDependencyNodeSelector(
          {
            selector: "CallExpression",
            kind: "value",
            name: "   ",
          },
          diagnostics,
          []
        )
      ).toBe(false);
    });

    it("returns true when the name has surrounding whitespace", () => {
      expect(
        isValidDependencyNodeSelector(
          {
            selector: "CallExpression",
            kind: "value",
            name: " custom ",
          },
          diagnostics,
          []
        )
      ).toBe(true);
    });

    it("returns false and warns when the value is not an object", () => {
      expect(
        isValidDependencyNodeSelector("not-an-object", diagnostics, [])
      ).toBe(false);

      report(diagnostics.build());

      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining(SETTINGS.ADDITIONAL_DEPENDENCY_NODES),
        expect.any(String)
      );
    });

    it("reports an invalid selector with the properties that a custom dependency node should have", () => {
      isValidDependencyNodeSelector({ kind: "value" }, diagnostics, [
        SETTINGS.ADDITIONAL_DEPENDENCY_NODES,
        2,
      ]);

      expect(diagnostics.build()).toEqual([
        {
          level: "warning",
          title: `Please provide a valid object in ${SETTINGS.ADDITIONAL_DEPENDENCY_NODES} setting.`,
          detail: `The object should be composed of the following properties: { selector: "<esquery selector>", kind: "value" | "type", name: "<string>" }. The invalid object will be ignored. ${SETTINGS_INFO}`,
          paths: [[SETTINGS.ADDITIONAL_DEPENDENCY_NODES, 2]],
        },
      ]);
    });

    it("returns false when the selector field is missing", () => {
      expect(
        isValidDependencyNodeSelector(
          { kind: "value", name: "custom" },
          diagnostics,
          []
        )
      ).toBe(false);
    });

    it("returns false when kind is invalid", () => {
      expect(
        isValidDependencyNodeSelector(
          {
            selector: "CallExpression",
            kind: "invalid",
            name: "custom",
          },
          diagnostics,
          []
        )
      ).toBe(false);
    });

    it("returns true when kind is omitted", () => {
      expect(
        isValidDependencyNodeSelector(
          {
            selector: "CallExpression",
            name: "custom",
          },
          diagnostics,
          []
        )
      ).toBe(true);
    });

    it("returns false when name is not a string", () => {
      expect(
        isValidDependencyNodeSelector(
          {
            selector: "CallExpression",
            kind: "value",
            name: 1,
          },
          diagnostics,
          []
        )
      ).toBe(false);
    });
  });

  describe("deprecateTypes", () => {
    it("does not warn when the value is falsy", () => {
      deprecateTypes(undefined, true, diagnostics);

      expect(diagnostics.build()).toEqual([]);
    });

    it("does not warn when legacy warnings are disabled", () => {
      deprecateTypes([validElementDescriptor], false, diagnostics);

      expect(diagnostics.build()).toEqual([]);
    });

    it("warns when the value is truthy", () => {
      deprecateTypes([validElementDescriptor], true, diagnostics);

      expect(diagnostics.build()).toEqual([
        {
          level: "deprecation",
          title: `'${SETTINGS.TYPES}' setting is deprecated.`,
          detail: `Please use '${SETTINGS.ELEMENTS}' instead. More info: https://www.jsboundaries.dev/docs/releases/migration-guides/v1-to-v2/`,
          paths: [[SETTINGS.TYPES]],
        },
      ]);
    });
  });

  describe("deprecateAlias", () => {
    it("does not warn when the value is falsy", () => {
      deprecateAlias(undefined, true, diagnostics);

      expect(diagnostics.build()).toEqual([]);
    });

    it("does not warn when legacy warnings are disabled", () => {
      deprecateAlias({ "@components": "src/components" }, false, diagnostics);

      expect(diagnostics.build()).toEqual([]);
    });

    it("warns when the value is truthy", () => {
      deprecateAlias({ "@components": "src/components" }, true, diagnostics);

      // cspell:ignore boundariesalias -- documentation anchor for the boundaries/alias setting
      expect(diagnostics.build()).toEqual([
        {
          level: "warning",
          title: `'${SETTINGS.ALIAS}' setting is deprecated.`,
          detail:
            "Configure path aliases using 'import/resolver' settings instead. More info: https://www.jsboundaries.dev/docs/settings/legacy/#boundariesalias",
          paths: [[SETTINGS.ALIAS]],
        },
      ]);
    });
  });

  describe("validateDebugFilterSelectors", () => {
    it("returns undefined when value is undefined", () => {
      expect(
        validateDebugFilterSelectors(undefined, "files", diagnostics)
      ).toBeUndefined();
      expect(diagnostics.build()).toEqual([]);
    });

    it("normalizes entity selectors for the 'files' filter", () => {
      const result = validateDebugFilterSelectors(
        { file: { categories: "util" } },
        "files",
        diagnostics
      );

      expect(result).toBeDefined();
    });

    it("normalizes file selectors for the 'files' filter", () => {
      const result = validateDebugFilterSelectors(
        { categories: "components" },
        "files",
        diagnostics
      );

      expect(result).toBeDefined();
    });

    it("does not take an entity selector for a valid 'dependencies' filter", () => {
      const result = validateDebugFilterSelectors(
        { file: { categories: "util" } },
        "dependencies",
        diagnostics
      );

      expect(result).toBeUndefined();
      expect(diagnostics.build()).toEqual([
        {
          level: "warning",
          title: `Please provide a valid array for 'dependencies' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
          detail: SETTINGS_INFO,
          paths: [[SETTINGS_KEYS_MAP.DEBUG, "filter", "dependencies"]],
        },
      ]);
    });

    it("warns and returns undefined for an invalid value", () => {
      const result = validateDebugFilterSelectors(
        "not-a-selector",
        "dependencies",
        diagnostics
      );
      report(diagnostics.build());

      expect(result).toBeUndefined();
      expect(reportedDiagnostic).toHaveBeenCalledWith(
        expect.stringContaining("dependencies"),
        expect.any(String)
      );
    });
  });

  describe("validateDebugFilesFilter", () => {
    it("delegates to validateDebugFilterSelectors with 'files'", () => {
      const result = validateDebugFilesFilter(
        { categories: "components" },
        diagnostics
      );

      expect(result).toBeDefined();
    });

    it("returns undefined for undefined input", () => {
      expect(validateDebugFilesFilter(undefined, diagnostics)).toBeUndefined();
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
      expect(reportedDiagnostic).not.toHaveBeenCalled();
    });
  });

  describe("normalizeSettings", () => {
    it("normalizes undefined settings with the defaults", () => {
      const { value, diagnostics: result } = normalizeSettings(undefined);

      expect(value.elementDescriptors).toEqual([]);
      expect(value.rootPath).toBeUndefined();
      expect(result).toEqual([
        {
          level: "warning",
          title: `Please provide element descriptors using the '${SETTINGS.ELEMENTS}' setting, or file descriptors using the '${SETTINGS_KEYS_MAP.FILES}' setting.`,
          detail: "More info: https://www.jsboundaries.dev/docs/settings/",
          paths: [[]],
        },
      ]);
    });

    it("does not mutate its input", () => {
      const settings = {
        [SETTINGS_KEYS_MAP.ELEMENTS]: [{ type: "legacy", pattern: "src/*" }],
        [SETTINGS_KEYS_MAP.IGNORE]: "dist/**",
      };
      const copy = structuredClone(settings);

      normalizeSettings(settings);

      expect(settings).toEqual(copy);
    });

    describe("elementDescriptors", () => {
      it("returns an empty array when no element descriptors are provided", () => {
        const result = normalize({});

        expect(result.elementDescriptors).toEqual([]);
      });

      it("does not warn about missing element descriptors when file descriptors are provided", () => {
        normalize({
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
        });

        expect(reportedDiagnostic).not.toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.ELEMENTS),
          expect.any(String)
        );
      });

      it("falls back to the deprecated 'types' setting and warns about deprecation", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.TYPES]: ["service"],
        });

        expect(result.elementDescriptors).toEqual([
          {
            type: "service",
            pattern: "service/*",
            match: ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER,
            capture: ["elementName"],
          },
        ]);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.TYPES),
          expect.stringContaining(SETTINGS.ELEMENTS)
        );
      });

      it("filters invalid descriptors and warns about them", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            validElementDescriptor,
            invalidElementDescriptor,
          ],
        });

        expect(result.elementDescriptors).toHaveLength(1);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
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
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { ...validElementDescriptor, mode: "folder" },
          ],
        });

        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("deprecated"),
          expect.stringContaining("partialMatch")
        );
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.any(String),
          expect.stringContaining(
            "migration-guides/v6-to-v7/#deprecated-mode-in-element-descriptors"
          )
        );
      });

      it("warns when any element descriptor uses the deprecated 'category' option", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { ...validElementDescriptor, category: "domain" },
          ],
        });

        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("'category' option in element descriptors"),
          expect.stringContaining(SETTINGS_KEYS_MAP.FILES)
        );
      });

      it("does not warn about deprecated 'category' option when no descriptor uses it", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        });

        expect(reportedDiagnostic).not.toHaveBeenCalledWith(
          expect.stringContaining("'category' option in element descriptors"),
          expect.any(String)
        );
      });

      it("warns that mode has no effect when partialMatch is false", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            {
              ...validElementDescriptor,
              mode: "full",
              partialMatch: false,
            },
          ],
        });

        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("no effect"),
          expect.stringContaining("mode")
        );
      });

      it("warns when an element descriptor uses a file-like pattern in folder mode", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { pattern: "components/**/*.ts", type: "component" },
          ],
        });

        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("file patterns"),
          expect.stringContaining("folders")
        );
      });

      it("does not warn about file-like patterns when the pattern has no extension in the last segment", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { pattern: "components/*", type: "component" },
          ],
        });

        expect(reportedDiagnostic).not.toHaveBeenCalledWith(
          expect.stringContaining("file patterns"),
          expect.any(String)
        );
      });

      it("ignores element descriptors that are not an array and warns about their format", () => {
        const { value, diagnostics: result } = normalizeSettings({
          [SETTINGS_KEYS_MAP.ELEMENTS]: "components/*",
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
        });

        expect(value.elementDescriptors).toEqual([]);
        expect(result).toEqual([
          {
            level: "warning",
            title: `Invalid ${SETTINGS.ELEMENTS} setting format.`,
            detail: `It should be an array of element descriptors. ${SETTINGS_INFO}`,
            paths: [[SETTINGS.ELEMENTS]],
          },
        ]);
      });

      it("warns about the format of the legacy types setting when it is not an array", () => {
        const { value, diagnostics: result } = normalizeSettings({
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
          [SETTINGS_KEYS_MAP.TYPES]: "components",
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
        });

        expect(value.elementDescriptors).toEqual([]);
        expect(result).toEqual([
          {
            level: "warning",
            title: `Invalid ${SETTINGS.TYPES} setting format.`,
            detail: `It should be an array of element descriptors. ${SETTINGS_INFO}`,
            paths: [[SETTINGS.TYPES]],
          },
        ]);
      });

      it("ignores an empty list of element descriptors without warning about it", () => {
        const { value, diagnostics: result } = normalizeSettings({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [],
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
        });

        expect(value.elementDescriptors).toEqual([]);
        expect(result).toEqual([]);
      });

      it("reports the deprecated 'category' option with the link to the v7 migration guide", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { ...validElementDescriptor, category: "domain" },
          ],
        });

        expect(result).toEqual([
          {
            level: "deprecation",
            title:
              "The 'category' option in element descriptors is deprecated and will be removed in a future major version.",
            detail: `Use the 'category' property in file descriptors ('${SETTINGS_KEYS_MAP.FILES}') instead. More info: https://www.jsboundaries.dev/docs/releases/migration-guides/v6-to-v7/#deprecated-category-in-element-descriptors-and-selectors`,
            paths: [[SETTINGS_KEYS_MAP.ELEMENTS, 0, "category"]],
          },
        ]);
      });

      it("lists the patterns of the element descriptors whose 'mode' has no effect", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { ...validElementDescriptor, mode: "full", partialMatch: false },
            validElementDescriptor,
            {
              type: "pages",
              pattern: ["a/*", "b/*"],
              partialMatch: false,
              mode: "folder",
            },
          ],
        });

        expect(result).toEqual([
          {
            level: "warning",
            title:
              "The 'mode' option has no effect when 'partialMatch: false' is set.",
            detail: `Remove 'mode' from these element descriptors: ["src/services/*",["a/*","b/*"]]. ${ELEMENTS_INFO}`,
            paths: [
              [SETTINGS_KEYS_MAP.ELEMENTS, 0, "mode"],
              [SETTINGS_KEYS_MAP.ELEMENTS, 2, "mode"],
            ],
          },
        ]);
      });

      it("does not report that 'mode' has no effect when 'partialMatch' is false and 'mode' is not set", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { ...validElementDescriptor, partialMatch: false },
          ],
        });

        expect(result).toEqual([]);
      });

      it("lists the file-like patterns of the element descriptors that match folders", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { type: "component", pattern: "components/**/*.ts" },
            validElementDescriptor,
            { type: "style", pattern: "styles/*.css", mode: "folder" },
          ],
        });

        expect(result).toEqual([
          {
            level: "warning",
            title: "Some element descriptors appear to use file patterns.",
            detail: `Element patterns match folders, not individual files. For file classification, use file descriptors ('${SETTINGS_KEYS_MAP.FILES}'). Affected patterns: ["components/**/*.ts","styles/*.css"]. ${ELEMENTS_INFO}`,
            paths: [
              [SETTINGS_KEYS_MAP.ELEMENTS, 0, "pattern"],
              [SETTINGS_KEYS_MAP.ELEMENTS, 2, "pattern"],
            ],
          },
        ]);
      });

      it("reports the file-like patterns of an element descriptor with 'partialMatch: false' even when it sets 'mode: \"full\"'", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            {
              type: "component",
              pattern: "components/**/*.ts",
              mode: "full",
              partialMatch: false,
            },
          ],
        });

        expect(result.map(({ title }) => title)).toEqual([
          "The 'mode' option has no effect when 'partialMatch: false' is set.",
          "Some element descriptors appear to use file patterns.",
        ]);
      });

      it("does not report the file-like patterns of element descriptors that match files", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { type: "full", pattern: "src/*.ts", mode: "full" },
            {
              type: "partial",
              pattern: "src/*.ts",
              mode: "full",
              partialMatch: true,
            },
          ],
        });

        expect(result).toEqual([]);
      });
    });

    describe("fileDescriptors", () => {
      it("returns an empty array when not provided", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        });

        expect(result.fileDescriptors).toEqual([]);
      });

      it("returns an empty array and warns about the format when value is not an array", () => {
        const { value, diagnostics: result } = normalizeSettings({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.FILES]: "invalid",
        });

        expect(value.fileDescriptors).toEqual([]);
        expect(result).toEqual([
          {
            level: "warning",
            title: `Invalid ${SETTINGS.FILES} setting format.`,
            detail: `It should be an array of file descriptors. ${SETTINGS_INFO}`,
            paths: [[SETTINGS.FILES]],
          },
        ]);
      });

      it("keeps all valid file descriptors without warning about invalid ones", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
        });

        expect(result.fileDescriptors).toEqual([validFileDescriptor]);
        expect(reportedDiagnostic).not.toHaveBeenCalledWith(
          expect.stringContaining("file descriptors"),
          expect.any(String)
        );
      });

      it("filters invalid file descriptors and warns about them", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.FILES]: [
            validFileDescriptor,
            invalidFileDescriptor,
          ],
        });

        expect(result.fileDescriptors).toHaveLength(1);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("file descriptors"),
          expect.stringContaining(JSON.stringify([invalidFileDescriptor]))
        );
      });
    });

    describe("classification layers", () => {
      it("warns when neither element nor file descriptors are provided", () => {
        normalize({});

        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.ELEMENTS),
          expect.any(String)
        );
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.FILES),
          expect.any(String)
        );
      });

      it("does not warn when only element descriptors are provided", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        });

        expect(reportedDiagnostic).not.toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.FILES),
          expect.any(String)
        );
      });

      it("does not warn when only file descriptors are provided", () => {
        normalize({
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
        });

        expect(reportedDiagnostic).not.toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.ELEMENTS),
          expect.any(String)
        );
      });
    });

    describe("dependencyNodes", () => {
      it("expands default dependency nodes when not provided", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        });

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
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: "invalid",
        });

        expect(result.dependencyNodes).toEqual([]);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.DEPENDENCY_NODES),
          expect.any(String)
        );
      });

      it("expands only the requested valid keys", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [
            DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
          ],
        });

        expect(result.dependencyNodes).toEqual(
          SETTINGS.DEFAULT_DEPENDENCY_NODES[DEPENDENCY_NODE_KEYS_MAP.REQUIRE]
        );
      });

      it("warns about invalid keys and filters them out", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [
            DEPENDENCY_NODE_KEYS_MAP.IMPORT,
            "bogus",
          ],
        });

        expect(result.dependencyNodes).toEqual(
          SETTINGS.DEFAULT_DEPENDENCY_NODES[DEPENDENCY_NODE_KEYS_MAP.IMPORT]
        );
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.DEPENDENCY_NODES),
          expect.stringContaining("bogus")
        );
      });

      it("does not report anything when all the keys are valid", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [
            DEPENDENCY_NODE_KEYS_MAP.IMPORT,
            DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
          ],
        });

        expect(result).toEqual([]);
      });

      it("lists the valid keys when the value is not an array", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: "import",
        });

        expect(result).toEqual([
          {
            level: "warning",
            title: `Invalid ${SETTINGS.DEPENDENCY_NODES} setting format.`,
            detail: `It should be an array of the following strings: "require", "import", "dynamic-import", "export". ${SETTINGS_INFO}`,
            paths: [[SETTINGS.DEPENDENCY_NODES]],
          },
        ]);
      });

      it("lists the invalid values and the valid keys when some keys are invalid", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [
            DEPENDENCY_NODE_KEYS_MAP.IMPORT,
            "bogus",
            1,
          ],
        });

        expect(result).toEqual([
          {
            level: "warning",
            title: `Invalid values in ${SETTINGS.DEPENDENCY_NODES} setting.`,
            detail: `Invalid values: ["bogus",1]. Valid strings are: "require", "import", "dynamic-import", "export". ${SETTINGS_INFO}`,
            paths: [
              [SETTINGS.DEPENDENCY_NODES, 1],
              [SETTINGS.DEPENDENCY_NODES, 2],
            ],
          },
        ]);
      });
    });

    describe("additionalDependencyNodes", () => {
      it("returns an empty array when not provided", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [],
        });

        expect(result.dependencyNodes).toEqual([]);
      });

      it("warns and returns an empty array when the value is not an array", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [],
          [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]: "invalid",
        });

        expect(result.dependencyNodes).toEqual([]);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
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
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [
            DEPENDENCY_NODE_KEYS_MAP.REQUIRE,
          ],
          [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]: [additional],
        });

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
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [],
          [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]: [
            valid,
            { kind: "value" },
          ],
        });

        expect(result.dependencyNodes).toEqual([valid]);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.ADDITIONAL_DEPENDENCY_NODES),
          expect.stringContaining(JSON.stringify([{ kind: "value" }]))
        );
      });

      it("filters additional nodes without a name and warns about them", () => {
        const valid = {
          selector: "CallExpression",
          kind: "value" as const,
          name: "custom",
        };
        const withoutName = {
          selector: "CallExpression",
          kind: "value" as const,
        };
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: [],
          [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]: [valid, withoutName],
        });

        expect(result.dependencyNodes).toEqual([valid]);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS.ADDITIONAL_DEPENDENCY_NODES),
          expect.stringContaining(JSON.stringify([withoutName]))
        );
      });

      it("does not report anything when all the additional nodes are valid", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
          [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]: [
            { selector: "CallExpression", kind: "value", name: "custom" },
          ],
        });

        expect(result).toEqual([]);
      });

      it("describes the properties of the additional nodes when the value is not an array", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
          [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]: "CallExpression",
        });

        expect(result).toEqual([
          {
            level: "warning",
            title: `Invalid ${SETTINGS.ADDITIONAL_DEPENDENCY_NODES} setting format.`,
            detail: `It should be an array containing objects with properties: { selector: "<esquery selector>", kind: "value" | "type", name: "<string>" }. ${SETTINGS_INFO}`,
            paths: [[SETTINGS.ADDITIONAL_DEPENDENCY_NODES]],
          },
        ]);
      });
    });

    describe("ignorePaths and includePaths", () => {
      it("returns undefined when not provided", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        });

        expect(result.ignorePaths).toBeUndefined();
        expect(result.includePaths).toBeUndefined();
      });

      it("wraps a string into an array", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.IGNORE]: "src/skip/**",
          [SETTINGS_KEYS_MAP.INCLUDE]: "src/keep/**",
        });

        expect(result.ignorePaths).toEqual(["src/skip/**"]);
        expect(result.includePaths).toEqual(["src/keep/**"]);
      });

      it("preserves arrays of strings", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.IGNORE]: ["a", "b"],
          [SETTINGS_KEYS_MAP.INCLUDE]: ["c", "d"],
        });

        expect(result.ignorePaths).toEqual(["a", "b"]);
        expect(result.includePaths).toEqual(["c", "d"]);
      });

      it("warns and returns undefined for invalid values", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.IGNORE]: ["a", 1],
          [SETTINGS_KEYS_MAP.INCLUDE]: ["c", 2],
        });

        expect(result.ignorePaths).toBeUndefined();
        expect(result.includePaths).toBeUndefined();
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.IGNORE),
          expect.any(String)
        );
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.INCLUDE),
          expect.any(String)
        );
      });

      it("describes the valid values of the setting when a value is invalid", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
          [SETTINGS_KEYS_MAP.IGNORE]: ["a", 1],
        });

        expect(result).toEqual([
          {
            level: "warning",
            title: `Please provide a valid value in '${SETTINGS_KEYS_MAP.IGNORE}' setting.`,
            detail: `The value should be a string or an array of strings. ${SETTINGS_INFO}`,
            paths: [[SETTINGS_KEYS_MAP.IGNORE]],
          },
        ]);
      });
    });

    describe("legacyTemplates, elementsSingleMatch, filesSingleMatch and cache", () => {
      it("applies defaults when undefined", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        });

        expect(result.legacyTemplates).toBe(LEGACY_TEMPLATES_DEFAULT);
        expect(result.elementsSingleMatch).toBe(ELEMENTS_SINGLE_TYPE_DEFAULT);
        expect(result.filesSingleMatch).toBe(false);
        expect(result.cache).toBe(CACHE_DEFAULT);
      });

      it("preserves boolean values", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: false,
          [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH]: false,
          [SETTINGS_KEYS_MAP.FILES_SINGLE_MATCH]: true,
          [SETTINGS_KEYS_MAP.CACHE]: false,
        });

        expect(result.legacyTemplates).toBe(false);
        expect(result.elementsSingleMatch).toBe(false);
        expect(result.filesSingleMatch).toBe(true);
        expect(result.cache).toBe(false);
      });

      it("falls back to the deprecated elements-single-type setting when elements-single-match is not provided", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]: false,
        });

        expect(result.elementsSingleMatch).toBe(false);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("deprecated"),
          expect.stringContaining(SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH)
        );
      });

      it("warns and falls back to defaults for a non-boolean deprecated elements-single-type value", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]: "no",
        });

        expect(result.elementsSingleMatch).toBe(ELEMENTS_SINGLE_TYPE_DEFAULT);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE),
          expect.stringContaining("boolean")
        );
      });

      it("does not warn about the deprecated elements-single-type setting when legacy-warnings is disabled", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]: false,
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
        });

        expect(result.elementsSingleMatch).toBe(false);
        expect(reportedDiagnostic).not.toHaveBeenCalled();
      });

      it("gives precedence to elements-single-match over the deprecated elements-single-type setting", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH]: true,
          [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]: false,
        });

        expect(result.elementsSingleMatch).toBe(true);
      });

      it("falls back to a valid deprecated elements-single-type value when elements-single-match is invalid", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH]: "no",
          [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]: false,
        });

        expect(result.elementsSingleMatch).toBe(false);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH),
          expect.stringContaining("boolean")
        );
      });

      it("warns about an invalid deprecated elements-single-type value even when elements-single-match is provided", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH]: true,
          [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]: "no",
        });

        expect(result.elementsSingleMatch).toBe(true);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE),
          expect.stringContaining("boolean")
        );
      });

      const nonBooleanSettings = {
        [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: "yes",
        [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH]: "no",
        [SETTINGS_KEYS_MAP.FILES_SINGLE_MATCH]: "no",
        [SETTINGS_KEYS_MAP.CACHE]: "maybe",
      };

      it("falls back to defaults for non-boolean values", () => {
        const result = normalize(nonBooleanSettings);

        expect(result.legacyTemplates).toBe(LEGACY_TEMPLATES_DEFAULT);
        expect(result.elementsSingleMatch).toBe(ELEMENTS_SINGLE_TYPE_DEFAULT);
        expect(result.filesSingleMatch).toBe(false);
        expect(result.cache).toBe(CACHE_DEFAULT);
      });

      it.each([
        SETTINGS_KEYS_MAP.LEGACY_TEMPLATES,
        SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_MATCH,
        SETTINGS_KEYS_MAP.FILES_SINGLE_MATCH,
        SETTINGS_KEYS_MAP.CACHE,
      ])("warns about the non-boolean value of '%s'", (settingKey) => {
        normalize(nonBooleanSettings);

        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(settingKey),
          expect.stringContaining("boolean")
        );
      });

      it("warns about deprecation when legacyTemplates is explicitly true", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: true,
        });

        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(
            `'${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting is deprecated`
          ),
          expect.stringContaining("{{...}}")
        );
      });

      it("reports the deprecated legacyTemplates setting with the link to the new template syntax", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: true,
        });

        expect(result).toEqual([
          {
            level: "deprecation",
            title: `'${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting is deprecated.`,
            detail:
              "The legacy ${...} template syntax will not be supported in the next major version. Migrate to the {{...}} Handlebars syntax. More info: https://www.jsboundaries.dev/docs/releases/migration-guides/v5-to-v6/#new-template-syntax",
            paths: [[SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]],
          },
        ]);
      });

      it("does not warn about deprecation when legacyTemplates is undefined", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        });

        expect(reportedDiagnostic).not.toHaveBeenCalledWith(
          expect.stringContaining(
            `'${SETTINGS_KEYS_MAP.LEGACY_TEMPLATES}' setting is deprecated`
          ),
          expect.any(String)
        );
      });

      it("does not warn about deprecation when legacyTemplates is explicitly false", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: false,
        });

        expect(reportedDiagnostic).not.toHaveBeenCalledWith(
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
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        });

        expect(result.flagAsExternal).toEqual(defaults);
      });

      it("warns and returns the defaults when the value is not an object", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: "invalid",
        });

        expect(result.flagAsExternal).toEqual(defaults);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL),
          expect.stringContaining("object")
        );
      });

      it("applies provided boolean overrides and custom source patterns", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: {
            unresolvableAlias: false,
            inNodeModules: false,
            outsideRootPath: true,
            customSourcePatterns: ["^@scope/"],
          },
        });

        expect(result.flagAsExternal).toEqual({
          unresolvableAlias: false,
          inNodeModules: false,
          outsideRootPath: true,
          customSourcePatterns: ["^@scope/"],
        });
      });

      it("keeps the defaults when the object omits all known fields", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: {},
        });

        expect(result.flagAsExternal).toEqual(defaults);
        expect(reportedDiagnostic).not.toHaveBeenCalled();
      });

      it("warns and keeps the default when customSourcePatterns mixes strings with other values", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: {
            customSourcePatterns: ["^@scope/", 1],
          },
        });

        expect(result).toEqual([
          {
            level: "warning",
            title: `Please provide a valid array of strings for 'customSourcePatterns' in '${SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL}' setting.`,
            detail: SETTINGS_INFO,
            paths: [
              [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL, "customSourcePatterns"],
            ],
          },
        ]);
      });

      it("warns once per invalid field and keeps defaults for the bad ones", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: {
            unresolvableAlias: "yes",
            inNodeModules: "no",
            outsideRootPath: "maybe",
            customSourcePatterns: [1, 2],
          },
        });

        expect(result.flagAsExternal).toEqual(defaults);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("unresolvableAlias"),
          expect.any(String)
        );
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("inNodeModules"),
          expect.any(String)
        );
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("outsideRootPath"),
          expect.any(String)
        );
        expect(reportedDiagnostic).toHaveBeenCalledWith(
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
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        });

        expect(result.debug).toStrictEqual(defaults);
      });

      it("returns the default 'messages' and 'filter', without reporting anything, when only 'enabled' is set", () => {
        const { value, diagnostics: result } = normalizeSettings({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: { enabled: true },
        });

        expect(result).toEqual([]);
        expect(value.debug).toStrictEqual({ ...defaults, enabled: true });
      });

      it("warns and returns defaults when the value is not an object", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: "invalid",
        });

        expect(result.debug).toEqual(defaults);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.DEBUG),
          expect.stringContaining("object")
        );
      });

      it("accepts a boolean for 'enabled'", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: { enabled: true },
        });

        expect(result.debug.enabled).toBe(true);
      });

      it("warns and falls back to default when 'enabled' is not a boolean", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: { enabled: "yes" },
        });

        expect(result.debug.enabled).toBe(false);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("enabled"),
          expect.any(String)
        );
      });

      it("warns and returns default messages when 'messages' is not an object", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: { messages: "invalid" },
        });

        expect(result.debug.messages).toEqual(defaults.messages);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("messages"),
          expect.any(String)
        );
      });

      it("reports the path of 'messages' when it is not an object", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: { messages: "invalid" },
        });

        expect(result).toEqual([
          {
            level: "warning",
            title: `Please provide a valid object for 'messages' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
            detail: SETTINGS_INFO,
            paths: [[SETTINGS_KEYS_MAP.DEBUG, "messages"]],
          },
        ]);
      });

      it("applies the 'violations' flag of 'messages'", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: { messages: { violations: false } },
        });

        expect(result.debug.messages).toEqual({
          files: true,
          dependencies: true,
          violations: false,
        });
      });

      it("returns default flags when 'messages' is an object with no known fields", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: { messages: {} },
        });

        expect(result.debug.messages).toEqual(defaults.messages);
        expect(reportedDiagnostic).not.toHaveBeenCalled();
      });

      it("applies partial 'messages' overrides and warns about invalid flags", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: {
            messages: {
              files: false,
              dependencies: "invalid",
            },
          },
        });

        expect(result.debug.messages).toEqual({
          files: false,
          dependencies: true,
          violations: true,
        });
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("messages.dependencies"),
          expect.any(String)
        );
      });

      it("warns and returns default filter when 'filter' is not an object", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: { filter: "invalid" },
        });

        expect(result.debug.filter).toStrictEqual(defaults.filter);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining("filter"),
          expect.any(String)
        );
      });

      it("reports the path of 'filter' when it is not an object", () => {
        const result = diagnosticsOf({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: { filter: "invalid" },
        });

        expect(result).toEqual([
          {
            level: "warning",
            title: `Please provide a valid object for 'filter' in '${SETTINGS_KEYS_MAP.DEBUG}' setting.`,
            detail: SETTINGS_INFO,
            paths: [[SETTINGS_KEYS_MAP.DEBUG, "filter"]],
          },
        ]);
      });

      it("normalizes valid filter entries", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.DEBUG]: {
            filter: {
              files: { categories: "components" },
              dependencies: { to: { element: { type: "" } } },
            },
          },
        });

        expect(result.debug.filter.files).toBeDefined();
        expect(result.debug.filter.dependencies).toBeDefined();
      });
    });

    describe("rootPath", () => {
      it("returns undefined when neither the option nor the setting are provided", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        });

        expect(result.rootPath).toBeUndefined();
      });

      it("returns the setting as written when the option is not provided", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.ROOT_PATH]: "relative/path",
        });

        expect(result.rootPath).toBe("relative/path");
      });

      it("returns undefined when the setting is not a string", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.ROOT_PATH]: 42,
        });

        expect(result.rootPath).toBeUndefined();
        expect(reportedDiagnostic).not.toHaveBeenCalled();
      });

      it("returns the root path option, resolved by the host, over the setting", () => {
        const { value } = normalizeSettings(
          {
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.ROOT_PATH]: "relative/path",
          },
          { rootPath: "/repo/relative/path" }
        );

        expect(value.rootPath).toBe("/repo/relative/path");
      });
    });

    describe("legacyWarnings", () => {
      it("returns true by default when the setting is absent", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
        });

        expect(result.legacyWarnings).toBe(LEGACY_WARNINGS_DEFAULT);
        expect(result.legacyWarnings).toBe(true);
      });

      it("returns false when explicitly set to false", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
        });

        expect(result.legacyWarnings).toBe(false);
      });

      it("warns and returns true when the value is not a boolean", () => {
        const result = normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: "yes",
        });

        expect(result.legacyWarnings).toBe(true);
        expect(reportedDiagnostic).toHaveBeenCalledWith(
          expect.stringContaining(SETTINGS_KEYS_MAP.LEGACY_WARNINGS),
          expect.stringContaining("boolean")
        );
      });

      it("skips all legacy deprecation warnings when set to false with boundaries/types", () => {
        normalize({
          [SETTINGS_KEYS_MAP.TYPES]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
        });

        const calls = reportedDiagnostic.mock.calls.map((c) => c[0]);

        expect(calls.some((m) => m.includes(SETTINGS.TYPES))).toBe(false);
      });

      it("skips all legacy deprecation warnings when set to false with boundaries/alias", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.ALIAS]: { "@comp": "src/components" },
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
        });

        const calls = reportedDiagnostic.mock.calls.map((c) => c[0]);

        expect(calls.some((m) => m.includes(SETTINGS.ALIAS))).toBe(false);
      });

      it("skips all legacy deprecation warnings when set to false with legacyTemplates: true", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: true,
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
        });

        const calls = reportedDiagnostic.mock.calls.map((c) => c[0]);

        expect(
          calls.some((m) => m.includes(SETTINGS_KEYS_MAP.LEGACY_TEMPLATES))
        ).toBe(false);
      });

      it("skips the mode deprecation .some() check when set to false with deprecated mode in element descriptors", () => {
        normalize({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { ...validElementDescriptor, mode: "folder" },
          ],
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
        });

        const calls = reportedDiagnostic.mock.calls.map((c) => c[0]);

        expect(calls.some((m) => m.includes("mode"))).toBe(false);
      });
    });
  });

  describe("normalizeSettings levels and paths", () => {
    /**
     * Returns the level and the paths of each diagnostic of some settings.
     * @param settings - The settings to normalize.
     * @returns The level and the paths of each diagnostic.
     */
    function levelsAndPaths(settings: Record<string, unknown>) {
      return normalizeSettings({
        [SETTINGS_KEYS_MAP.FILES]: [validFileDescriptor],
        ...settings,
      }).diagnostics.map(({ level, paths }) => ({ level, paths }));
    }

    it("returns the index of each invalid element descriptor", () => {
      expect(
        levelsAndPaths({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            invalidElementDescriptor,
            validElementDescriptor,
            invalidElementDescriptor,
          ],
        })
      ).toEqual([
        {
          level: "warning",
          paths: [
            [SETTINGS_KEYS_MAP.ELEMENTS, 0],
            [SETTINGS_KEYS_MAP.ELEMENTS, 2],
          ],
        },
      ]);
    });

    it("returns the paths under the deprecated 'types' setting when it is used", () => {
      expect(
        levelsAndPaths({
          [SETTINGS_KEYS_MAP.TYPES]: [
            validElementDescriptor,
            invalidElementDescriptor,
          ],
        })
      ).toEqual([
        { level: "deprecation", paths: [[SETTINGS_KEYS_MAP.TYPES]] },
        { level: "warning", paths: [[SETTINGS_KEYS_MAP.TYPES, 1]] },
      ]);
    });

    it("does not report file patterns in element descriptors that match files", () => {
      expect(
        levelsAndPaths({
          [SETTINGS_KEYS_MAP.LEGACY_WARNINGS]: false,
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { type: "file", pattern: "src/index.ts", mode: "file" },
          ],
        })
      ).toEqual([]);
    });

    it("returns the pattern of element descriptors with several patterns when one of them matches files", () => {
      expect(
        levelsAndPaths({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { type: "file", pattern: ["src/folder", "src/index.ts"] },
          ],
        })
      ).toEqual([
        {
          level: "warning",
          paths: [[SETTINGS_KEYS_MAP.ELEMENTS, 0, "pattern"]],
        },
      ]);
    });

    it("returns the property of the element descriptors with deprecated or ineffective options", () => {
      expect(
        levelsAndPaths({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [
            { ...validElementDescriptor, mode: "folder", partialMatch: false },
            { ...validElementDescriptor, category: "domain" },
            { type: "file", pattern: "src/index.ts" },
          ],
        })
      ).toEqual([
        {
          level: "deprecation",
          paths: [[SETTINGS_KEYS_MAP.ELEMENTS, 0, "mode"]],
        },
        {
          level: "deprecation",
          paths: [[SETTINGS_KEYS_MAP.ELEMENTS, 1, "category"]],
        },
        { level: "warning", paths: [[SETTINGS_KEYS_MAP.ELEMENTS, 0, "mode"]] },
        {
          level: "warning",
          paths: [[SETTINGS_KEYS_MAP.ELEMENTS, 2, "pattern"]],
        },
      ]);
    });

    it("returns the index of each invalid file descriptor", () => {
      expect(
        levelsAndPaths({
          [SETTINGS_KEYS_MAP.FILES]: [
            validFileDescriptor,
            invalidFileDescriptor,
          ],
        })
      ).toEqual([{ level: "warning", paths: [[SETTINGS_KEYS_MAP.FILES, 1]] }]);
    });

    it("returns the paths of the dependency nodes settings", () => {
      expect(
        levelsAndPaths({
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: ["import", "invalid"],
          [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]: [
            { selector: "CallExpression", kind: "value" },
            "invalid",
          ],
        })
      ).toEqual([
        {
          level: "warning",
          paths: [[SETTINGS_KEYS_MAP.DEPENDENCY_NODES, 1]],
        },
        {
          level: "warning",
          paths: [
            [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES, 0],
            [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES, 1],
          ],
        },
        {
          level: "warning",
          paths: [
            [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES, 0],
            [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES, 1],
          ],
        },
      ]);
    });

    it("returns the key of the settings with an invalid value", () => {
      expect(
        levelsAndPaths({
          [SETTINGS_KEYS_MAP.DEPENDENCY_NODES]: "import",
          [SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES]: "node",
          [SETTINGS_KEYS_MAP.IGNORE]: 1,
          [SETTINGS_KEYS_MAP.INCLUDE]: 1,
          [SETTINGS_KEYS_MAP.CACHE]: "yes",
          [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: "yes",
          [SETTINGS_KEYS_MAP.DEBUG]: "yes",
        })
      ).toEqual(
        [
          SETTINGS_KEYS_MAP.DEPENDENCY_NODES,
          SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES,
          SETTINGS_KEYS_MAP.IGNORE,
          SETTINGS_KEYS_MAP.INCLUDE,
          SETTINGS_KEYS_MAP.CACHE,
          SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL,
          SETTINGS_KEYS_MAP.DEBUG,
        ].map((key) => ({ level: "warning", paths: [[key]] }))
      );
    });

    it("returns the property of the invalid options of the object settings", () => {
      expect(
        levelsAndPaths({
          [SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL]: {
            inNodeModules: "yes",
            customSourcePatterns: "yes",
          },
          [SETTINGS_KEYS_MAP.DEBUG]: {
            enabled: "yes",
            messages: { files: "yes" },
            filter: { files: 1 },
          },
        })
      ).toEqual([
        {
          level: "warning",
          paths: [[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL, "inNodeModules"]],
        },
        {
          level: "warning",
          paths: [[SETTINGS_KEYS_MAP.FLAG_AS_EXTERNAL, "customSourcePatterns"]],
        },
        { level: "warning", paths: [[SETTINGS_KEYS_MAP.DEBUG, "enabled"]] },
        {
          level: "warning",
          paths: [[SETTINGS_KEYS_MAP.DEBUG, "messages", "files"]],
        },
        {
          level: "warning",
          paths: [[SETTINGS_KEYS_MAP.DEBUG, "filter", "files"]],
        },
      ]);
    });

    it("returns the level of the deprecated settings that still work and of the ones that have no effect", () => {
      expect(
        levelsAndPaths({
          [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
          [SETTINGS_KEYS_MAP.ALIAS]: { "@app": "src" },
          [SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]: true,
          [SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]: true,
        })
      ).toEqual([
        { level: "warning", paths: [[SETTINGS_KEYS_MAP.ALIAS]] },
        {
          level: "deprecation",
          paths: [[SETTINGS_KEYS_MAP.LEGACY_TEMPLATES]],
        },
        {
          level: "deprecation",
          paths: [[SETTINGS_KEYS_MAP.ELEMENTS_SINGLE_TYPE]],
        },
      ]);
    });
  });
});
