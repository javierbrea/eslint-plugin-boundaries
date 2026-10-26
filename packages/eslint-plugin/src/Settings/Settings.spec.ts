jest.mock("../Debug", () => {
  const mockWarnOnce = jest.fn();
  return {
    warnOnce: mockWarnOnce,
    // Prints through the mocked warnOnce, as the real one does
    warnDiagnostics: jest.fn(
      (diagnostics: { title: string; detail?: string }[]) => {
        for (const { title, detail } of diagnostics) {
          mockWarnOnce(title, detail);
        }
      }
    ),
  };
});

import { resolve } from "node:path";

import { SETTINGS_KEYS_MAP } from "@boundaries/config";
import type { Rule } from "eslint";

import { warnOnce } from "../Debug";
import { SETTINGS } from "../Shared";

import { getSettings } from "./Settings";

const mockedWarnOnce = jest.mocked(warnOnce);

function buildContext(settings: Record<string, unknown>): Rule.RuleContext {
  return { settings } as unknown as Rule.RuleContext;
}

const validElementDescriptor = { pattern: "src/services/*", type: "service" };

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

  describe("getSettings", () => {
    it("caches the normalized settings per context.settings reference", () => {
      const context = buildContext({
        [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
      });

      const first = getSettings(context);
      const second = getSettings(context);

      expect(first).toBe(second);
    });

    it("prints the problems of the settings once, in order", () => {
      const context = buildContext({
        [SETTINGS_KEYS_MAP.ELEMENTS]: [{ pattern: "src/**" }],
        [SETTINGS_KEYS_MAP.CACHE]: "yes",
      });

      getSettings(context);
      getSettings(context);

      expect(mockedWarnOnce.mock.calls.map(([title]) => title)).toEqual([
        "Some element descriptors are invalid and will be ignored.",
        `Please provide element descriptors using the '${SETTINGS_KEYS_MAP.ELEMENTS}' setting, or file descriptors using the '${SETTINGS_KEYS_MAP.FILES}' setting.`,
        `Please provide a valid value in '${SETTINGS_KEYS_MAP.CACHE}' setting.`,
      ]);
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
        const result = getSettings(
          buildContext({
            [SETTINGS_KEYS_MAP.ELEMENTS]: [validElementDescriptor],
            [SETTINGS_KEYS_MAP.ROOT_PATH]: "/abs/path",
          })
        );

        expect(result.rootPath).toBe("/abs/path");
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

      it("prints the root path warning after the problems of the other settings", () => {
        process.env[SETTINGS.ENV_ROOT_PATH] = "env/relative";

        getSettings(buildContext({}));

        expect(mockedWarnOnce.mock.calls.map(([title]) => title)).toEqual([
          `Please provide element descriptors using the '${SETTINGS_KEYS_MAP.ELEMENTS}' setting, or file descriptors using the '${SETTINGS_KEYS_MAP.FILES}' setting.`,
          `Please provide a valid value in '${SETTINGS_KEYS_MAP.ROOT_PATH}' setting.`,
        ]);
      });
    });
  });
});
