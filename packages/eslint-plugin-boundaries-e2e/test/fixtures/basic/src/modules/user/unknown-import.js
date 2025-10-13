// This should be INVALID - module cannot import unknown elements
import unknown from "../../unknown/unknown-element/unknown.js";

export const userModule = () => {
  return unknown;
};
