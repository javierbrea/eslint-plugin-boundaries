import type { Example } from "@/domains/examples/data/examples";

/** What the user asked to put in the place of the sketch on screen: the sketch of the source, or an example. */
export type Replacement =
  | { readonly kind: "reset" }
  | { readonly kind: "example"; readonly example: Example };
