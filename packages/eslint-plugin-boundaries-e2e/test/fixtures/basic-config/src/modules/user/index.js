// This should be VALID - module can import component
import { Button } from '../../components/button/index.js';

export const userModule = () => {
  return Button();
};