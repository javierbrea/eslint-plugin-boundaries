// This should be VALID - module can import component
import { Button } from "../../components/button/index";

export const userModule = () => {
  return Button();
};
