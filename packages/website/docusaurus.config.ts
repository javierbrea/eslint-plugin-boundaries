// eslint-disable-next-line import/no-namespace
import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "JS Boundaries",
  tagline: "Draw boundaries, build quality software",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://www.jsboundaries.dev",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "javierbrea", // Usually your GitHub org/user name.
  projectName: "eslint-plugin-boundaries", // Usually your repo name.

  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "throw",
    },
  },
  trailingSlash: true,

  headTags: [
    {
      tagName: "link",
      attributes: {
        rel: "manifest",
        href: "/site.webmanifest",
      },
    },
    {
      tagName: "meta",
      attributes: {
        property: "og:image",
        content: "https://www.jsboundaries.dev/img/og-image.png",
      },
    },
    {
      tagName: "meta",
      attributes: {
        name: "twitter:image",
        content: "https://www.jsboundaries.dev/img/og-image.png",
      },
    },
  ],

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/javierbrea/eslint-plugin-boundaries/edit/master/packages/website/",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "JS Boundaries",
      hideOnScroll: true,
      style: "dark",
      logo: {
        alt: "Boundaries Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          to: "docs/overview/",
          position: "left",
          label: "Getting Started",
        },
        {
          to: "docs/setup/",
          position: "left",
          label: "Setup",
        },
        {
          to: "docs/rules/overview/",
          position: "left",
          label: "Rules",
        },
        {
          type: "custom-githubStarsButton",
          position: "right",
        },
        {
          href: "https://github.com/javierbrea/eslint-plugin-boundaries",
          position: "right",
          className: "navbar-github-link",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "/docs/overview/",
            },
            {
              label: "Setup",
              to: "/docs/setup/",
            },
            {
              label: "Rules",
              to: "/docs/rules/overview/",
            },
            {
              label: "TypeScript",
              to: "/docs/guides/typescript-support/",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Code of Conduct",
              to: "https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/.github/CODE_OF_CONDUCT.md",
            },
            {
              label: "Discussions",
              to: "https://github.com/javierbrea/eslint-plugin-boundaries/discussions",
            },
            {
              label: "Project Backlog",
              to: "https://github.com/users/javierbrea/projects/7",
            },
            {
              label: "Contribute",
              to: "https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/.github/CONTRIBUTING.md",
            },
          ],
        },
        {
          title: "Acknowledgements",
          items: [
            {
              label: "Project",
              to: "/docs/misc/acknowledgments/",
            },
            {
              label: "Eslint Plugin Import",
              to: "https://github.com/import-js/eslint-plugin-import",
              className: "footer-acknowledgement",
            },
            {
              label: "Website",
              to: "/docs/misc/acknowledgments/",
            },
            {
              label: "Built with Docusaurus",
              to: "https://docusaurus.io/",
              className: "footer-acknowledgement",
            },
            {
              label: "Hosted by Netlify",
              to: "https://www.netlify.com/",
              className: "footer-acknowledgement",
            },
            {
              label: "Search by Algolia",
              to: "https://www.algolia.com/",
              className: "footer-acknowledgement",
            },
            {
              label: "Illustrations by unDraw",
              to: "https://undraw.co/",
              className: "footer-acknowledgement",
            },
          ],
        },
      ],
      copyright: `
        <div class="footer-contents">
          <span>Copyright © 2020-${new Date().getFullYear()} Javier Brea</span>
          <span class="disclaimer">Trademarks, logos and brand names are the property of their respective owners. All company, product and service names used in this website are for identification purposes only. Use of these names,trademarks and brands does not imply endorsement.</span>
        </div>
      `,
      logo: {
        alt: "Boundaries logo",
        src: "img/logo.svg",
        width: 50,
        href: "https://www.jsboundaries.dev",
      },
    },
    prism: {
      defaultLanguage: "javascript",
      additionalLanguages: ["typescript", "json", "bash", "js-extras"],
      // WARNING: In case of modifying these themes, make sure to keep the CodeDiff component updated as well (also in custom.css)
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
