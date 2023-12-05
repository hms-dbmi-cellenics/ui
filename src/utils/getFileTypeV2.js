import { sampleTech } from 'utils/constants';

const fileTypesByTech = {
  [sampleTech['10X']]: {
    // This handling won't be necessary after the file validation is refactored
    'matrix.mtx.gz': 'matrix10x',
    'barcodes.tsv.gz': 'barcodes10x',
    'features.tsv.gz': 'features10x',
    'genes.tsv.gz': 'features10x',
    'matrix.mtx': 'matrix10x',
    'barcodes.tsv': 'barcodes10x',
    'features.tsv': 'features10x',
    'genes.tsv': 'features10x',
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

const fileTypeToDisplay = {
  barcodes10x: 'barcodes.tsv',
  features10x: 'genes.tsv',
  matrix10x: 'matrix.mtx',
  '10x_h5': 'matrix.h5',
  seurat: 'seurat rds',
  rhapsody: 'expression_data.st',
};

const getFileTypeV2 = (fileName, selectedTech) => {
  const fileTypes = fileTypesByTech[selectedTech];

  if (Object.keys(fileTypes).length === 1) return Object.values(fileTypes)[0];

  return fileTypes[fileName];
};

export default getFileTypeV2;
export { fileTypeToDisplay };
