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
      label: "Setup",
      link: {
        type: "doc",
        id: "setup/setup",
      },
      collapsed: true,
      items: [
        "setup/elements",
        "setup/selectors",
        "setup/rules",
        "setup/settings",
      ],
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
        "rules/entry-point",
        "rules/external",
        "rules/no-unknown",
        "rules/no-private",
      ],
    },
    {
      type: "category",
      label: "Guides",
      collapsed: true,
      items: [
        "guides/typescript-support",
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
            "releases/migration-guides/v1-to-v2",
            "releases/migration-guides/v3-to-v4",
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
