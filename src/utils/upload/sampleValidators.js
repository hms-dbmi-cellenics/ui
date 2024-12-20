import { sampleTech } from 'utils/constants';

import validate10x from 'utils/upload/validate10x';
import validateRhapsody from 'utils/upload/validateRhapsody';
import validateObj2s from 'utils/upload/validateObj2s';
import validateH5 from 'utils/upload/validateH5';
import validateParse from 'utils/upload/validateParse';

const sampleValidators = {
  [sampleTech['10X']]: validate10x,
  [sampleTech.RHAPSODY]: validateRhapsody,
  [sampleTech.SEURAT_OBJECT]: validateObj2s,
  [sampleTech.SEURAT_SPATIAL_OBJECT]: validateObj2s,
  [sampleTech.SCE_OBJECT]: validateObj2s,
  [sampleTech.ANNDATA_OBJECT]: validateObj2s,
  [sampleTech.H5]: validateH5,
  [sampleTech.PARSE]: validateParse,
};

export default sampleValidators;
