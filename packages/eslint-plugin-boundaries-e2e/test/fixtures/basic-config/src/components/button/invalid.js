// This should be INVALID - component should not import module
import { userModule } from '../../modules/user/index.js';

export const InvalidButton = () => {
  return userModule();
};