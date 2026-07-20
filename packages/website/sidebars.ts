import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  docs: [
    {
      type: "category",
      label: "Getting Started",
      collapsed: false,
      items: ["overview", "installation", "quick-start"],
    },
    {
      type: "category",
      label: "Classification",
      link: {
        type: "doc",
        id: "classification/classification",
      },
      collapsed: true,
      items: [
        {
          type: "category",
          label: "Elements",
          link: {
            type: "doc",
            id: "classification/elements",
          },
          items: ["classification/elements/legacy"],
        },
        "classification/files",
        "classification/modules",
        "classification/dependency",
      ],
    },
    {
      type: "category",
      label: "Selectors",
      link: {
        type: "doc",
        id: "selectors/selectors",
      },
      collapsed: true,
      items: [
        "selectors/element",
        "selectors/file",
        "selectors/module",
        "selectors/dependency",
        {
          type: "category",
          label: "Legacy",
          collapsed: true,
          items: [
            "selectors/legacy/element",
            "selectors/legacy/dependency",
            "selectors/legacy/templates",
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Policies",
      link: {
        type: "doc",
        id: "policies/policies",
      },
      collapsed: true,
      items: ["policies/legacy"],
    },
    {
      type: "category",
      label: "Settings",
      link: {
        type: "doc",
        id: "settings/settings",
      },
      collapsed: true,
      items: ["settings/config-helpers", "settings/legacy"],
    },
    {
      type: "category",
      label: "Rules",
      link: {
        type: "doc",
        id: "rules/rules",
      },
      collapsed: true,
      items: [
        "rules/dependencies",
        "rules/no-unknown-dependencies",
        "rules/no-ignored-dependencies",
        "rules/no-unknown-files",
        {
          type: "category",
          label: "Deprecated Rules",
          collapsed: true,
          items: ["rules/entry-point", "rules/external", "rules/no-private"],
        },
      ],
    },
    {
      type: "category",
      label: "Guides",
      collapsed: true,
      items: [
        "guides/typescript-support",
        "guides/monorepo-setup",
        "guides/oxlint-integration",
        "guides/custom-resolvers",
        "guides/debugging",
      ],
    },
    {
      type: "category",
      label: "Releases",
      link: {
        type: "doc",
        id: "releases/releases",
      },
      items: [
        {
          type: "category",
          label: "Migration Guides",
          collapsed: false,
          items: [
            "releases/migration-guides/v6-to-v7",
            "releases/migration-guides/v5-to-v6",
            "releases/migration-guides/v3-to-v4",
            "releases/migration-guides/v1-to-v2",
          ],
        },
      ],
    },
    {
      type: "doc",
      id: "misc/acknowledgments",
      label: "Acknowledgements",
    },
  ],
};

export default sidebars;
