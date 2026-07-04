import type { ModuleDescription } from "./ModuleDescription.types";
import { ORIGINS_MAP } from "./ModuleDescription.types";
import { isOriginDescription } from "./ModuleDescriptionHelpers";

function createValidModuleDescription(
  overrides?: Partial<ModuleDescription>
): ModuleDescription {
  return {
    origin: ORIGINS_MAP.LOCAL,
    source: null,
    internalPath: null,
    ...overrides,
  };
}

describe("ModuleDescriptionHelpers", () => {
  describe("isOriginDescription", () => {
    it.each(Object.values(ORIGINS_MAP))(
      "should return true for a valid description with '%s' origin",
      (origin) => {
        const value = createValidModuleDescription({ origin });

        expect(isOriginDescription(value)).toBe(true);
      }
    );

    it("should return true for an external module with source and internalPath", () => {
      const value = createValidModuleDescription({
        origin: ORIGINS_MAP.EXTERNAL,
        source: "lodash",
        internalPath: "get",
      });

      expect(isOriginDescription(value)).toBe(true);
    });

    it("should return false when origin is not a valid value", () => {
      const value = { origin: "invalid", source: null, internalPath: null };

      expect(isOriginDescription(value)).toBe(false);
    });

    it("should return false when origin is missing", () => {
      const value = { source: "./module", internalPath: null };

      expect(isOriginDescription(value)).toBe(false);
    });

    it("should return false when none of the expected properties are present", () => {
      const value = { foo: "bar" };

      expect(isOriginDescription(value)).toBe(false);
    });

    it("should return false for an empty object", () => {
      expect(isOriginDescription({})).toBe(false);
    });

    it.each(["string", 123, null, undefined, [], true])(
      "should return false for non-object value: %p",
      (value) => {
        expect(isOriginDescription(value)).toBe(false);
      }
    );
  });
});
