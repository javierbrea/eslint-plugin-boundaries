import type { SettingsNormalized } from "../Shared";

import { getElementsMatcher } from "./Elements";

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
    elementsSingleType: false,
    cache: true,
    flagAsExternal: {},
    debug: {
      enabled: false,
      filter: {},
      messages: { files: false, dependencies: false, violations: false },
    },
    ...overrides,
  }) as SettingsNormalized;

describe("getElementsMatcher", () => {
  it("should return the same matcher instance for the same settings reference", () => {
    const settings = createSettings({
      elementDescriptors: [
        { type: "components", pattern: "components/*" },
      ] as SettingsNormalized["elementDescriptors"],
    });

    expect(getElementsMatcher(settings)).toBe(getElementsMatcher(settings));
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

    expect(getElementsMatcher(settingsA)).not.toBe(
      getElementsMatcher(settingsB)
    );
  });
});
