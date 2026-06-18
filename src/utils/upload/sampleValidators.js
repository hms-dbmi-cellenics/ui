import { sampleTech } from 'utils/constants';

import validate10x from 'utils/upload/validate10x';
import validateRhapsody from 'utils/upload/validateRhapsody';
import validateObj2s from 'utils/upload/validateObj2s';
import validateH5 from 'utils/upload/validateH5';
import validateParse from 'utils/upload/validateParse';
import validateSpatialCountMatrix from 'utils/upload/validateSpatialCountMatrix';

const sampleValidators = {
  [sampleTech['10X']]: validate10x,
  [sampleTech.RHAPSODY]: validateRhapsody,
  [sampleTech.SEURAT_OBJECT]: validateObj2s,
  [sampleTech.SEURAT_SPATIAL_OBJECT]: validateObj2s,
  [sampleTech.SCE_OBJECT]: validateObj2s,
  [sampleTech.ANNDATA_OBJECT]: validateObj2s,
  [sampleTech.H5]: validateH5,
  [sampleTech.PARSE]: validateParse,
  [sampleTech.VISIUM_HD]: validateObj2s,
  // Xenium is an end-to-end count-matrix tech (not an obj2s pre-processed object);
  // no content validation in v1.
  [sampleTech.XENIUM]: validateSpatialCountMatrix,
};

export default sampleValidators;
