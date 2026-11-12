/** What the docs write to get the link of an example: the project in text mode and the config */
export type PlaygroundHashInput = {
  /** The boundaries part of an ESLint config, `{ settings, rules }`, as JSON5 text. It is not read: the playground reports what is wrong with it when the link opens */
  readonly config: string;
  /** The project as text mode shows it: one path per line, folders ending in `/`, and the dependencies of a file indented two spaces under it, written as statements such as `import { a } from "./a.js";` */
  readonly project: string;
};
