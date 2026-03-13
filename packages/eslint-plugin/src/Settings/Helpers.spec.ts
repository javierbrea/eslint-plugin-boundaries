import { DEPENDENCY_KINDS_MAP } from "@boundaries/elements";

import {
  DEPENDENCY_NODE_KEYS_MAP,
  RULE_NAMES_MAP,
  RULE_POLICY_ALLOW,
  RULE_POLICY_DISALLOW,
  SETTINGS_KEYS_MAP,
} from "../Shared/Settings.types";

import {
  detectLegacyElementSelector,
  detectLegacyTemplateSyntax,
  docsUrl,
  isDependencyNodeKey,
  isImportKind,
  isLegacyElementSelector,
  isLegacyType,
  isRuleName,
  isRulePolicy,
  isRuleShortName,
  isSettingsKey,
  migrationGuideLink,
  migrationToV2GuideLink,
  migrationToV6GuideLink,
  moreInfoLink,
  moreInfoSettingsLink,
  ruleDocsUrl,
  rulesMainKey,
  warnMigrationToDependencies,
} from "./Helpers";

const expectDocsPath = (url: string, path: string, anchor?: string): void => {
  expect(url).toEqual(expect.stringContaining(`https://www.jsboundaries.dev/`));
  expect(url).toEqual(expect.stringContaining(`/docs/${path}/`));

  if (anchor) {
    expect(url).toEqual(expect.stringContaining(`#${anchor}`));
  }
};

const expectMoreInfoLink = (
  message: string,
  path: string,
  anchor?: string
): void => {
  expect(message).toEqual(expect.stringContaining("More info: "));
  expectDocsPath(message, path, anchor);
};

describe("docsUrl", () => {
  it("should return docs url without anchor", () => {
    expectDocsPath(docsUrl("rules/dependencies"), "rules/dependencies");
  });

  it("should return docs url with anchor", () => {
    expectDocsPath(
      docsUrl("rules/dependencies", "selectors"),
      "rules/dependencies",
      "selectors"
    );
  });
});

describe("ruleDocsUrl", () => {
  it("should return docs url for a non-deprecated rule", () => {
    expectDocsPath(ruleDocsUrl(RULE_NAMES_MAP.NO_PRIVATE), "rules/no-private");
  });

  it("should map deprecated element-types rule to dependencies docs", () => {
    expectDocsPath(
      ruleDocsUrl(RULE_NAMES_MAP.ELEMENT_TYPES),
      "rules/dependencies"
    );
  });

  it("should pass anchor to docs url", () => {
    expectDocsPath(
      ruleDocsUrl(RULE_NAMES_MAP.DEPENDENCIES, "schema"),
      "rules/dependencies",
      "schema"
    );
  });
});

describe("moreInfoLink", () => {
  it("should build more info message without anchor", () => {
    expectMoreInfoLink(moreInfoLink("setup/settings"), "setup/settings");
  });

  it("should build more info message with anchor", () => {
    expectMoreInfoLink(
      moreInfoLink("setup/settings", "debug"),
      "setup/settings",
      "debug"
    );
  });
});

describe("migrationGuideLink", () => {
  it("should return migration guide link without anchor", () => {
    expectMoreInfoLink(
      migrationGuideLink("5", "6"),
      "releases/migration-guides/v5-to-v6"
    );
  });

  it("should return migration guide link with anchor", () => {
    expectMoreInfoLink(
      migrationGuideLink("1", "2", "changes"),
      "releases/migration-guides/v1-to-v2",
      "changes"
    );
  });
});

describe("migrationToV6GuideLink", () => {
  it("should return migration to v6 link", () => {
    expectMoreInfoLink(
      migrationToV6GuideLink(),
      "releases/migration-guides/v5-to-v6"
    );
  });

  it("should return migration to v6 link with anchor", () => {
    expectMoreInfoLink(
      migrationToV6GuideLink("selectors"),
      "releases/migration-guides/v5-to-v6",
      "selectors"
    );
  });
});

describe("migrationToV2GuideLink", () => {
  it("should return migration to v2 link", () => {
    expectMoreInfoLink(
      migrationToV2GuideLink(),
      "releases/migration-guides/v1-to-v2"
    );
  });

  it("should return migration to v2 link with anchor", () => {
    expectMoreInfoLink(
      migrationToV2GuideLink("selectors"),
      "releases/migration-guides/v1-to-v2",
      "selectors"
    );
  });
});

describe("moreInfoSettingsLink", () => {
  it("should return settings docs link without anchor", () => {
    expectMoreInfoLink(moreInfoSettingsLink(), "setup/settings");
  });

  it("should return settings docs link with anchor", () => {
    expectMoreInfoLink(
      moreInfoSettingsLink("cache"),
      "setup/settings",
      "cache"
    );
  });
});

describe("warnMigrationToDependencies", () => {
  const getWarnSpy = () => {
    const debugModule = jest.requireActual("../../src/Debug/Debug") as {
      warnOnce: (message: string, details?: string) => boolean;
    };

    return jest.spyOn(debugModule, "warnOnce").mockReturnValue(true);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should warn with migration info and mapped docs path", () => {
    const warnSpy = getWarnSpy();

    warnMigrationToDependencies(RULE_NAMES_MAP.ELEMENT_TYPES);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `Rule "${RULE_NAMES_MAP.ELEMENT_TYPES}" is deprecated`
      ),
      expect.stringContaining(
        'Please migrate to the "boundaries/dependencies" rule'
      )
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(
        // cspell: disable-next-line
        "/docs/rules/dependencies/#migration-to-boundariesdependencies"
      )
    );
  });
});

describe("isImportKind", () => {
  it("should return true for valid dependency kind", () => {
    expect(isImportKind(DEPENDENCY_KINDS_MAP.TYPE)).toBe(true);
  });

  it("should return false for invalid values", () => {
    expect(isImportKind("invalid-kind")).toBe(false);
    expect(isImportKind(1)).toBe(false);
  });
});

describe("isDependencyNodeKey", () => {
  it("should return true for valid dependency node key", () => {
    expect(isDependencyNodeKey(DEPENDENCY_NODE_KEYS_MAP.IMPORT)).toBe(true);
  });

  it("should return false for invalid values", () => {
    expect(isDependencyNodeKey("invalid-node")).toBe(false);
    expect(isDependencyNodeKey(false)).toBe(false);
  });
});

describe("isSettingsKey", () => {
  it("should return true for valid settings key", () => {
    expect(isSettingsKey(SETTINGS_KEYS_MAP.ELEMENTS)).toBe(true);
  });

  it("should return false for invalid values", () => {
    expect(isSettingsKey("boundaries/unknown")).toBe(false);
    expect(isSettingsKey({})).toBe(false);
  });
});

describe("isRulePolicy", () => {
  it("should return true for allow/disallow policies", () => {
    expect(isRulePolicy(RULE_POLICY_ALLOW)).toBe(true);
    expect(isRulePolicy(RULE_POLICY_DISALLOW)).toBe(true);
  });

  it("should return false for invalid values", () => {
    expect(isRulePolicy("maybe")).toBe(false);
    expect(isRulePolicy(null)).toBe(false);
  });
});

describe("isRuleName", () => {
  it("should return true for valid rule name", () => {
    expect(isRuleName(RULE_NAMES_MAP.NO_UNKNOWN)).toBe(true);
  });

  it("should return false for invalid values", () => {
    expect(isRuleName("no-unknown")).toBe(false);
    expect(isRuleName(undefined)).toBe(false);
  });
});

describe("isRuleShortName", () => {
  it("should return true for valid short rule name", () => {
    expect(isRuleShortName("dependencies")).toBe(true);
  });

  it("should return false for invalid values", () => {
    expect(isRuleShortName("boundaries/dependencies")).toBe(false);
    expect(isRuleShortName(1)).toBe(false);
  });
});

describe("isLegacyType", () => {
  it("should return true for string values", () => {
    expect(isLegacyType("helpers")).toBe(true);
  });

  it("should return false for non-string values", () => {
    expect(isLegacyType({ type: "helpers" })).toBe(false);
    expect(isLegacyType(null)).toBe(false);
  });
});

describe("isLegacyElementSelector", () => {
  it("should return true for legacy string selector", () => {
    expect(isLegacyElementSelector("helpers")).toBe(true);
  });

  it("should return true for legacy tuple selector", () => {
    expect(isLegacyElementSelector(["helpers", { family: "ui" }])).toBe(true);
  });

  it("should return false for invalid selector shapes", () => {
    expect(isLegacyElementSelector(["helpers"])).toBe(false);
    expect(isLegacyElementSelector([1, { family: "ui" }])).toBe(false);
    expect(isLegacyElementSelector({ type: "helpers" })).toBe(false);
  });
});

describe("detectLegacyElementSelector", () => {
  it("should return true when selector is a legacy string", () => {
    expect(detectLegacyElementSelector("helpers")).toBe(true);
  });

  it("should return true when one selector in array uses legacy syntax", () => {
    expect(
      detectLegacyElementSelector([{ type: "helpers" }, "components"])
    ).toBe(true);
  });

  it("should return false for array without legacy selectors", () => {
    expect(
      detectLegacyElementSelector([
        { type: "helpers" },
        { type: "components", captured: { family: "ui" } },
      ])
    ).toBe(false);
  });

  it("should return false for falsy selector values", () => {
    expect(detectLegacyElementSelector(undefined)).toBe(false);
    expect(detectLegacyElementSelector(null)).toBe(false);
  });
});

describe("detectLegacyTemplateSyntax", () => {
  it("should return true for string values containing legacy template syntax", () => {
    expect(detectLegacyTemplateSyntax("${from.type}")).toBe(true);
  });

  it("should return false for string values without legacy template syntax", () => {
    expect(detectLegacyTemplateSyntax("{{from.type}}")).toBe(false);
  });

  it("should return true for arrays containing a nested legacy template", () => {
    expect(
      detectLegacyTemplateSyntax([
        "value",
        {
          captured: {
            family: "${from.family}",
          },
        },
      ])
    ).toBe(true);
  });

  it("should return false for objects without legacy template syntax", () => {
    expect(
      detectLegacyTemplateSyntax({
        captured: {
          family: "{{from.family}}",
        },
      })
    ).toBe(false);
  });

  it("should return false for null and primitive non-string values", () => {
    expect(detectLegacyTemplateSyntax(null)).toBe(false);
    expect(detectLegacyTemplateSyntax(10)).toBe(false);
    expect(detectLegacyTemplateSyntax(true)).toBe(false);
  });
});

describe("rulesMainKey", () => {
  it("should return provided rule main key", () => {
    expect(rulesMainKey("to")).toBe("to");
    expect(rulesMainKey("target")).toBe("target");
  });

  it("should default to from", () => {
    expect(rulesMainKey()).toBe("from");
  });
});
