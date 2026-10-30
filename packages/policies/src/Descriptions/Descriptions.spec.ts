import type { SettingsNormalized } from "@boundaries/config";
import { Elements } from "@boundaries/elements";

import { describeDependency, describeEntity, getMatcher } from "./Descriptions";

const createSettings = (
  overrides: Partial<SettingsNormalized> = {}
): SettingsNormalized =>
  ({
    elementDescriptors: [],
    fileDescriptors: [],
    ignorePaths: undefined,
    includePaths: undefined,
    rootPath: "/repo",
    dependencyNodes: [],
    legacyTemplates: false,
    elementsSingleMatch: false,
    filesSingleMatch: false,
    cache: true,
    flagAsExternal: {},
    debug: {
      enabled: false,
      filter: {},
      messages: { files: false, dependencies: false, violations: false },
    },
    ...overrides,
  }) as SettingsNormalized;

const createProjectSettings = () =>
  createSettings({
    elementDescriptors: [
      { type: "component", pattern: "src/components/*" },
      { type: "helper", pattern: "src/helpers/*" },
    ] as SettingsNormalized["elementDescriptors"],
    fileDescriptors: [
      { pattern: "**/*.spec.ts", category: "test" },
    ] as SettingsNormalized["fileDescriptors"],
  });

describe("Descriptions", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe("getMatcher", () => {
    it("should return the same matcher instance for the same settings reference", () => {
      const settings = createProjectSettings();

      expect(getMatcher(settings)).toBe(getMatcher(settings));
    });

    it("should build the matcher of a settings reference only once", () => {
      const elementsGetMatcher = jest.spyOn(Elements.prototype, "getMatcher");
      const settings = createProjectSettings();

      getMatcher(settings);
      getMatcher(settings);

      expect(elementsGetMatcher).toHaveBeenCalledTimes(1);
    });

    it("should return different matcher instances for settings with different descriptors", () => {
      const settingsA = createSettings({
        elementDescriptors: [
          { type: "components", pattern: "components/*" },
        ] as SettingsNormalized["elementDescriptors"],
      });
      const settingsB = createSettings({
        elementDescriptors: [
          { type: "modules", pattern: "modules/*" },
        ] as SettingsNormalized["elementDescriptors"],
      });

      expect(getMatcher(settingsA)).not.toBe(getMatcher(settingsB));
    });
  });

  describe("describeEntity", () => {
    it("should describe the element and the file categories of a file", () => {
      const settings = createProjectSettings();

      const description = describeEntity(
        settings,
        "/repo/src/components/Price/Price.spec.ts"
      );

      expect(description.element.types).toEqual(["component"]);
      expect(description.file.categories).toEqual(["test"]);
      expect(description.module.origin).toBe("local");
    });

    it("should pass the ignore paths of the settings to the matcher", () => {
      const settings = createSettings({
        elementDescriptors: [
          { type: "helper", pattern: "src/helpers/*" },
        ] as SettingsNormalized["elementDescriptors"],
        ignorePaths: ["**/helpers/**"],
      });

      const description = describeEntity(
        settings,
        "/repo/src/helpers/format/index.ts"
      );

      expect(description.file.isIgnored).toBe(true);
    });

    it("should return what the matcher of the settings returns", () => {
      const settings = createProjectSettings();
      const filePath = "/repo/src/helpers/format/index.ts";

      expect(describeEntity(settings, filePath)).toEqual(
        getMatcher(settings).describeEntity(filePath)
      );
    });
  });

  describe("describeDependency", () => {
    it("should describe a local dependency between two elements", () => {
      const settings = createProjectSettings();

      const description = describeDependency(settings, {
        from: "/repo/src/components/Price/index.ts",
        to: "/repo/src/helpers/format/index.ts",
        source: "../../helpers/format",
        kind: "value",
        nodeKind: "import",
        specifiers: ["format"],
      });

      expect(description.from.element.types).toEqual(["component"]);
      expect(description.to.element.types).toEqual(["helper"]);
      expect(description.dependency.specifiers).toEqual(["format"]);
    });

    it("should describe an unresolved package as an external module", () => {
      const settings = createProjectSettings();

      const description = describeDependency(settings, {
        from: "/repo/src/components/Price/index.ts",
        source: "react",
        kind: "value",
        nodeKind: "import",
      });

      expect(description.to.module.origin).toBe("external");
      expect(description.to.module.source).toBe("react");
    });
  });
});
