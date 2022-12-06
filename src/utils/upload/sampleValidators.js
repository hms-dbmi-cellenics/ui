import { sampleTech } from 'utils/constants';

import validate10x from 'utils/upload/validate10x';
import validateRhapsody from 'utils/upload/validateRhapsody';

const sampleValidators = {
  [sampleTech['10X']]: validate10x,
  [sampleTech.RHAPSODY]: validateRhapsody,
};

export default sampleValidators;
