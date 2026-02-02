// Importing helper from same package
import { HelperB } from "../helper-b";

export const HelperA = () => {
  return HelperB();
};
