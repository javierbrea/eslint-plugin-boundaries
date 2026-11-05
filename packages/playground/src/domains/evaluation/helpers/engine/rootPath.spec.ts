import { resolveRootPath } from "./rootPath";

describe("RootPath", () => {
  describe("resolveRootPath", () => {
    it.each([
      ["the settings are not an object", "settings"],
      ["the settings are null", null],
      ["the setting is not set", {}],
      ["the setting is not a string", { "boundaries/root-path": 5 }],
      ["the setting is empty", { "boundaries/root-path": "" }],
      ["the setting is the current folder", { "boundaries/root-path": "." }],
      ["the setting ends where it starts", { "boundaries/root-path": "a/.." }],
    ])("should return the root of the sketch when %s", (_title, settings) => {
      // Act
      const rootPath = resolveRootPath(settings);

      // Assert
      expect(rootPath).toBe("");
    });

    it.each([
      ["a POSIX path", "/home/user/project"],
      ["a path from the root of the drive on Windows", "\\project"],
      ["a Windows path", "C:\\Users\\user\\project"],
      ["a Windows path with forward slashes", "c:/project"],
    ])(
      "should return the root of the sketch for %s, as the sketch is the project at that path",
      (_title, setting) => {
        // Act
        const rootPath = resolveRootPath({ "boundaries/root-path": setting });

        // Assert
        expect(rootPath).toBe("");
      }
    );

    it.each([
      ["packages/app", "packages/app"],
      ["./packages/app/", "packages/app"],
      ["packages\\app", "packages/app"],
      ["packages//./app", "packages/app"],
      ["packages/other/../app", "packages/app"],
    ])(
      "should resolve %s against the root of the sketch",
      (setting, expected) => {
        // Act
        const rootPath = resolveRootPath({ "boundaries/root-path": setting });

        // Assert
        expect(rootPath).toBe(expected);
      }
    );

    it.each(["..", "../..", "../project", "packages/../../project"])(
      "should return the root of the sketch for %s, which is above it, as the sketch is the project at that path",
      (setting) => {
        // Act
        const rootPath = resolveRootPath({ "boundaries/root-path": setting });

        // Assert
        expect(rootPath).toBe("");
      }
    );
  });
});
