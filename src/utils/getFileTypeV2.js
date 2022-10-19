const _ = require('lodash');

const fileTypes = {
  matrix: 'matrix10x',
  barcodes: 'barcodes10x',
  features: 'features10x',
  genes: 'features10x',
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
