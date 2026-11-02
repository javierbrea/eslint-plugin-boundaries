import { RULE_NAMES_MAP } from "../Shared";

import {
  docsUrl,
  getRuleDocsPath,
  migrationGuideLink,
  migrationToV2GuideLink,
  migrationToV6GuideLink,
  migrationToV7GuideLink,
  moreInfoElementsLink,
  moreInfoLegacySettingsLink,
  moreInfoLink,
  moreInfoSelectorsLink,
  moreInfoSettingsLink,
  ruleDocsUrl,
} from "./Docs";

const DOCS = "https://www.jsboundaries.dev/docs";

describe("Docs", () => {
  describe("docsUrl", () => {
    it("returns the URL of a docs page, ending with a slash", () => {
      expect(docsUrl("settings")).toBe(`${DOCS}/settings/`);
    });

    it("adds the anchor when provided", () => {
      expect(docsUrl("settings", "cache")).toBe(`${DOCS}/settings/#cache`);
    });
  });

  describe("getRuleDocsPath", () => {
    it.each([
      [RULE_NAMES_MAP.DEPENDENCIES, "rules/dependencies"],
      [RULE_NAMES_MAP.ELEMENT_TYPES, "rules/dependencies"],
      [RULE_NAMES_MAP.NO_IGNORED, "rules/no-ignored-dependencies"],
      [RULE_NAMES_MAP.NO_UNKNOWN, "rules/no-unknown-dependencies"],
      [RULE_NAMES_MAP.ENTRY_POINT, "rules/entry-point"],
    ])("returns the docs path of rule '%s'", (ruleName, path) => {
      expect(getRuleDocsPath(ruleName)).toBe(path);
    });
  });

  describe("ruleDocsUrl", () => {
    it("returns the docs URL of a rule", () => {
      expect(ruleDocsUrl(RULE_NAMES_MAP.NO_PRIVATE)).toBe(
        `${DOCS}/rules/no-private/`
      );
    });

    it("adds the anchor when provided", () => {
      expect(ruleDocsUrl(RULE_NAMES_MAP.DEPENDENCIES, "options")).toBe(
        `${DOCS}/rules/dependencies/#options`
      );
    });
  });

  describe("moreInfoLink", () => {
    it("returns a 'More info' message with the docs URL", () => {
      expect(moreInfoLink("settings")).toBe(`More info: ${DOCS}/settings/`);
    });
  });

  describe("migration guide links", () => {
    it("returns the link of the migration guide between two versions", () => {
      expect(migrationGuideLink("1", "2", "anchor")).toBe(
        `More info: ${DOCS}/releases/migration-guides/v1-to-v2/#anchor`
      );
    });

    it.each([
      [migrationToV2GuideLink, "v1-to-v2"],
      [migrationToV6GuideLink, "v5-to-v6"],
      [migrationToV7GuideLink, "v6-to-v7"],
    ])("returns the link of the migration guide %#", (link, guide) => {
      expect(link()).toBe(
        `More info: ${DOCS}/releases/migration-guides/${guide}/`
      );
    });
  });

  describe("section links", () => {
    it.each([
      [moreInfoSettingsLink, "settings"],
      [moreInfoElementsLink, "classification/elements"],
      [moreInfoLegacySettingsLink, "settings/legacy"],
      [moreInfoSelectorsLink, "selectors/element"],
    ])("returns the link of docs section %#", (link, path) => {
      expect(link("anchor")).toBe(`More info: ${DOCS}/${path}/#anchor`);
    });
  });
});
