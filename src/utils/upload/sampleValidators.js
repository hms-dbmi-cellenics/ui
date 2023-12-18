import { sampleTech } from 'utils/constants';

import validate10x from 'utils/upload/validate10x';
import validateRhapsody from 'utils/upload/validateRhapsody';
import validateSeurat from 'utils/upload/validateSeurat';
import validateH5 from 'utils/upload/validateH5';
import validateParse from 'utils/upload/validateParse';

const sampleValidators = {
  [sampleTech['10X']]: validate10x,
  [sampleTech.RHAPSODY]: validateRhapsody,
  [sampleTech.SEURAT]: validateSeurat,
  [sampleTech.H5]: validateH5,
  [sampleTech.PARSE]: validateParse,
};

export default sampleValidators;
