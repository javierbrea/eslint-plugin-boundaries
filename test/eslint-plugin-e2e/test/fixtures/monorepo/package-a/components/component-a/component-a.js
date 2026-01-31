// Importing helper from package-b
import { HelperA } from "../../../package-b/helpers/helper-a";

export const ComponentA = () => {
  return HelperA();
};
