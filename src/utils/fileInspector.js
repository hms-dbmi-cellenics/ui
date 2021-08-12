import techOptions from './fileUploadSpecifications';
// import { strToU8 } from 'fflate';

const VERDICT = {
  INVALID_NAME: 0,
  VALID_ZIPPED: 1,
  VALID_UNZIPPED: 2,
};

// const MATRIX_SIGNATURE = strToU8('%%MatrixMarket')

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

  // test if gzip ./
  // %%MatrixMarket for .mtx
  // ENS or "ENS for features.tsv
};

export {
  inspectFile,
  VERDICT,
};
