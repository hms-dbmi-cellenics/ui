const fileTypes = {
  matrix: 'matrix10x',
  barcodes: 'barcodes10x',
  features: 'features10x',
  genes: 'features10x',
};

const getFileTypeV2 = (fileName) => {
  let fileType;

  Object.entries(fileTypes).forEach(([name, type]) => {
    if (fileName.includes(name)) {
      fileType = type;
      return false;
    }
  });

  return fileType;
};

export default getFileTypeV2;
