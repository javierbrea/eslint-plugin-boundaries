import type {
  ElementSingleSelectorNormalized,
  ParentElementSingleSelector,
} from "./ElementSelector.types";

export type ElementSingleSelectorMatchResult = Omit<
  ElementSingleSelectorNormalized,
  "parent"
> & {
  parent?: ParentElementSingleSelector | null;
};
