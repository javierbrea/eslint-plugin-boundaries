import type { Diagnostic } from "@boundaries/config";

import { areRulesValid, hasErrorUnder, pointsTo } from "./Diagnostics";

const SETTINGS_WARNING: Diagnostic = {
  level: "warning",
  title: "Some element descriptors are invalid and will be ignored.",
  detail: "Invalid descriptors: [].",
  paths: [["settings", "boundaries/elements", 1]],
};

const RULE_ERROR: Diagnostic = {
  level: "error",
  title: "[boundaries/dependencies] Invalid rule options.",
  paths: [["rules", "boundaries/dependencies", 1, "default"]],
};

const RULE_DEPRECATION: Diagnostic = {
  level: "deprecation",
  title: "Legacy selectors.",
  detail: "Replace them.",
  paths: [["rules", "boundaries/dependencies", 1]],
};

describe("Diagnostics", () => {
  describe("pointsTo", () => {
    it("should be true when a diagnostic has exactly the path", () => {
      // Arrange
      const diagnostics = [RULE_ERROR, SETTINGS_WARNING];

      // Act
      const result = pointsTo(diagnostics, [
        "settings",
        "boundaries/elements",
        1,
      ]);

      // Assert
      expect(result).toBe(true);
    });

    it("should be false when the paths of the diagnostics are longer than the path", () => {
      // Arrange
      const diagnostics = [
        {
          ...SETTINGS_WARNING,
          paths: [["settings", "boundaries/elements", 1, "mode"]],
        },
      ];

      // Act
      const result = pointsTo(diagnostics, [
        "settings",
        "boundaries/elements",
        1,
      ]);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when the paths of the diagnostics are shorter than the path", () => {
      // Arrange
      const diagnostics = [{ ...SETTINGS_WARNING, paths: [["settings"]] }];

      // Act
      const result = pointsTo(diagnostics, [
        "settings",
        "boundaries/elements",
        1,
      ]);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when the path is another entry", () => {
      // Arrange
      const diagnostics = [SETTINGS_WARNING];

      // Act
      const result = pointsTo(diagnostics, [
        "settings",
        "boundaries/elements",
        0,
      ]);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false without diagnostics", () => {
      // Arrange
      // Act
      const result = pointsTo([], ["settings"]);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("hasErrorUnder", () => {
    it("should be true when an error has a path inside the path", () => {
      // Arrange
      const diagnostics = [SETTINGS_WARNING, RULE_ERROR];

      // Act
      const result = hasErrorUnder(diagnostics, [
        "rules",
        "boundaries/dependencies",
      ]);

      // Assert
      expect(result).toBe(true);
    });

    it("should be true when an error has exactly the path", () => {
      // Arrange
      const diagnostics = [{ ...RULE_ERROR, paths: [["rules"]] }];

      // Act
      const result = hasErrorUnder(diagnostics, ["rules"]);

      // Assert
      expect(result).toBe(true);
    });

    it("should be true when only one of the paths of an error is inside the path", () => {
      // Arrange
      const diagnostics: Diagnostic[] = [
        {
          ...RULE_ERROR,
          paths: [
            ["rules", "boundaries/dependencies", 1, "policies", 0],
            ["rules", "boundaries/dependencies", 1, "policies", 2],
          ],
        },
      ];

      // Act
      const result = hasErrorUnder(diagnostics, [
        "rules",
        "boundaries/dependencies",
        1,
        "policies",
        2,
      ]);

      // Assert
      expect(result).toBe(true);
    });

    it("should be false when the diagnostics inside the path are not errors", () => {
      // Arrange
      const diagnostics = [RULE_DEPRECATION, SETTINGS_WARNING];

      // Act
      const result = hasErrorUnder(diagnostics, ["rules"]);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when the errors are about another entry", () => {
      // Arrange
      const diagnostics = [RULE_ERROR];

      // Act
      const result = hasErrorUnder(diagnostics, [
        "rules",
        "boundaries/no-private",
      ]);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("areRulesValid", () => {
    it("should be false when an error is about a rule", () => {
      // Arrange
      const diagnostics = [SETTINGS_WARNING, RULE_ERROR];

      // Act
      const result = areRulesValid(diagnostics);

      // Assert
      expect(result).toBe(false);
    });

    it("should be true when the only error is about the settings", () => {
      // Arrange
      const diagnostics: Diagnostic[] = [
        { level: "error", title: "Key settings", paths: [["settings"]] },
        RULE_DEPRECATION,
      ];

      // Act
      const result = areRulesValid(diagnostics);

      // Assert
      expect(result).toBe(true);
    });
  });
});
