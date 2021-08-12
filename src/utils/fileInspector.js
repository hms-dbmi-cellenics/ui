import techOptions from './fileUploadSpecifications';

const VERDICT = {
  INVALID_NAME: 0,
  INVALID_FORMAT: 0,
  VALID_ZIPPED: 1,
  VALID_UNZIPPED: 2,
  VALID_MATRIX: 3,
  VALID_FEATURES: 4,
  VALID_BARCODES: 5,
};

const MATRIX_SIGNATURE = Buffer.from('%%MatrixMarket', 'ascii');
const FEATURES_SIGNATURE = Buffer.from('ENS', 'ascii');

const GZIP_SIGNATURE = Buffer.from([0x1f, 0x8b]);

const inspectFile = (name, data, technology) => {
  const validNames = techOptions[technology].acceptedFiles;

  if (!validNames.has(name)) {
    return VERDICT.INVALID_NAME;
  }

  const fileSignature = data.slice(0, 2);

  const isGzipped = !fileSignature.compare(GZIP_SIGNATURE);

  if (isGzipped) {
    return VERDICT.VALID_ZIPPED;
  }

  if (name.startsWith('matrix')
    && !data.slice(0, MATRIX_SIGNATURE.length).compare(MATRIX_SIGNATURE)) {
    return VERDICT.VALID_MATRIX;
  }

  // check file starts with Ensembl Stable ID - ENS or "ENS
  if ((name.startsWith('features') || name.startsWith('genes'))
      && (!data.slice(0, 3).compare(FEATURES_SIGNATURE)
      || !data.slice(1, 4).compare(FEATURES_SIGNATURE))) {
    return VERDICT.VALID_FEATURES;
  }

  if (name.startsWith('barcodes')) {
    return VERDICT.VALID_BARCODES;
  }

  return VERDICT.INVALID_FORMAT;
};

export {
  inspectFile,
  VERDICT,
};
