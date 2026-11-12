// The second entry of the package, `@boundaries/playground/share`. It only reaches helpers, so it loads no React, no MUI and no component, and it runs in Node.js, where the docs compute a playground link while they render on the server.
export { getPlaygroundHash } from "@/domains/share/helpers/playgroundHash";
export type { PlaygroundHashInput } from "@/domains/share/helpers/playgroundHash";
