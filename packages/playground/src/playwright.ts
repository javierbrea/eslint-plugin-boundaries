// The `@boundaries/playground/playwright` entry: the Playwright page objects of the components and the base that a host extends for its own. It runs in Node.js, inside the Playwright runner, and its build imports nothing but `@playwright/test`. A page object is exported from here, by file, beside the jsdom sibling it mirrors
export { PlaygroundPom } from "@/app/Playground.pom.playwright";
export { ShellPom } from "@/domains/shell/modules/Shell/Shell.pom.playwright";
export { ShellLayoutPom } from "@/domains/shell/ui/templates/ShellLayout/ShellLayout.pom.playwright";
export { Pom } from "@/shared/testing/pom/pom.playwright";
export type {
  PomChildOptions,
  PomOptions,
  PomSearchBase,
} from "@/shared/testing/pom/pom.types.playwright";
