// Importing helper from package-a
import { HelperB } from "../../../package-b/helpers/helper-b";

export const HelperA = () => {
  return HelperB();
};
