import techOptions from './fileUploadSpecifications';
import readFileToBuffer from './readFileToBuffer';

const Verdict = {
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

// Validate a file requested for upload to the platform.
const inspectFile = async (file, technology) => {
  // immediately discard file if filename is not in valid set
  const validNames = techOptions[technology].acceptedFiles;
  if (!validNames.has(file.name)) {
    return Verdict.INVALID_NAME;
  }

  // if name is valid, inspect first 16 bytes to validate format
  const data = await readFileToBuffer(file.slice(0, 16));

  const fileSignature = data.slice(0, 2);
  const isGzipped = !fileSignature.compare(GZIP_SIGNATURE);
  if (isGzipped) {
    return Verdict.VALID_ZIPPED;
  }

  if (file.name.startsWith('matrix')
    && !data.slice(0, MATRIX_SIGNATURE.length).compare(MATRIX_SIGNATURE)) {
    return Verdict.VALID_MATRIX;
  }

  // check file starts with Ensembl Stable ID - ENS or "ENS
  if ((file.name.startsWith('features') || file.name.startsWith('genes'))
      && (!data.slice(0, 3).compare(FEATURES_SIGNATURE)
      || !data.slice(1, 4).compare(FEATURES_SIGNATURE))) {
    return Verdict.VALID_FEATURES;
  }

  if (file.name.startsWith('barcodes')) {
    return Verdict.VALID_BARCODES;
  }

  return Verdict.INVALID_FORMAT;
};

export {
  inspectFile,
  Verdict,
};
