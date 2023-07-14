import { sampleTech } from 'utils/constants';

const fileTypesByTech = {
  [sampleTech['10X']]: {
    'matrix.mtx.gz': 'matrix10x',
    'barcodes.tsv.gz': 'barcodes10x',
    'features.tsv.gz': 'features10x',
    'genes.tsv.gz': 'features10x',
  },
  [sampleTech.H5]: {
    'matrix.h5': '10x_h5',
  },
  [sampleTech.SEURAT]: {
    'r.rds': 'seurat',
  },
  [sampleTech.RHAPSODY]: {
    expression_data: 'rhapsody',
  },
};

const getFileTypeV2 = (fileName, selectedTech) => {
  const fileTypes = fileTypesByTech[selectedTech];

  if (Object.keys(fileTypes).length === 1) return Object.values(fileTypes)[0];

  return fileTypes[fileName];
};

export default getFileTypeV2;
