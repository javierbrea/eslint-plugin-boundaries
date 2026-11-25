import { normalizeConfig } from "@boundaries/config";
import type { SettingsNormalized } from "@boundaries/config";
import { Policies } from "@boundaries/policies";

import { getPolicies } from "./PoliciesInstances";

/**
 * Normalizes the settings of a config with one element descriptor, a new object on every call.
 * @returns The normalized settings.
 */
function normalizeSettings(): SettingsNormalized {
  return normalizeConfig({
    settings: {
      "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }],
    },
    rules: {},
  }).value.settings;
}

describe("PoliciesInstances", () => {
  describe("getPolicies", () => {
    it("should return a Policies instance", () => {
      // Arrange
      const settings = normalizeSettings();

      // Act
      const policies = getPolicies(settings);

      // Assert
      expect(policies).toBeInstanceOf(Policies);
    });

    it("should return the same instance on every call with the same settings object", () => {
      // Arrange
      const settings = normalizeSettings();

      // Act
      const first = getPolicies(settings);
      const second = getPolicies(settings);
      const third = getPolicies(settings);

      // Assert
      expect(second).toBe(first);
      expect(third).toBe(first);
    });

    it("should create an instance for each settings object, even when another one has equal content", () => {
      // Arrange
      const settings = normalizeSettings();
      const equalSettings = normalizeSettings();

      // Act
      const policies = getPolicies(settings);
      const otherPolicies = getPolicies(equalSettings);

      // Assert
      expect(equalSettings).not.toBe(settings);
      expect(equalSettings).toEqual(settings);
      expect(otherPolicies).not.toBe(policies);
      expect(getPolicies(settings)).toBe(policies);
      expect(getPolicies(equalSettings)).toBe(otherPolicies);
    });
  });
});
