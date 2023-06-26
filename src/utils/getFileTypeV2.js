const _ = require('lodash');

const fileTypes = {
  'matrix.h5': '10x_h5',
  matrix: 'matrix10x',
  barcodes: 'barcodes10x',
  features: 'features10x',
  genes: 'features10x',
  '.rds': 'seurat',
  expression_data: 'rhapsody',
};

const getFileTypeV2 = (fileName) => {
  let fileType;

  _.forEach(Object.entries(fileTypes), ([name, type]) => {
    if (fileName.toLowerCase().includes(name)) {
      fileType = type;
      return false;
    }
  });

  return fileType;
};

export default getFileTypeV2;
