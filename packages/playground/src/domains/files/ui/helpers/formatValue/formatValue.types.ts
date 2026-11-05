/** A value the engine describes: what JSON can hold, so that `formatValue` has a case for each kind. */
export type DescribedValue =
  | string
  | number
  | boolean
  | null
  | DescribedValue[]
  | { readonly [key: string]: DescribedValue };
