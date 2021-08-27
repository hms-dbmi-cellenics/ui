import { Gunzip } from 'fflate';

import techOptions from './fileUploadSpecifications';
import readFileToBuffer from './readFileToBuffer';

const Verdict = {
  INVALID_NAME: -2,
  INVALID_FORMAT: -1,
  VALID_ZIPPED: 0,
  VALID_UNZIPPED: 1,
};

const MATRIX_SIGNATURE = Buffer.from('%%MatrixMarket');

const FEATURES_SIGNATURE = Buffer.from('ENS'); // Ensembl Stable ID prefix
const FEATURES_NC_SIGNATURE = Buffer.from('lnc'); // long non-coding region

const GZIP_SIGNATURE = Buffer.from([0x1f, 0x8b]);

const FILE_TYPES = {
  BARCODES: 'BARCODES',
  FEATURES: 'FEATURES',
  GENES: 'FEATURES',
  MATRIX: 'MATRIX',
};

// Min bytes read for different file types
const MIN_FILE_READ_LENGTH = {
  [FILE_TYPES.BARCODES]: 10,
  [FILE_TYPES.FEATURES]: 10,
  [FILE_TYPES.MATRIX]: 14,
};

const inspectFile = async (file, technology) => {
  // Validate a file requested for upload to the platform.

  // immediately discard file if filename is not in valid set
  const validNames = techOptions[technology].acceptedFiles;
  if (!validNames.has(file.name)) {
    return Verdict.INVALID_NAME;
  }

  // Check the file type of each file
  let fileType = null;
  if (file.name.startsWith('matrix')) {
    fileType = FILE_TYPES.MATRIX;
  } else if (
    file.name.startsWith('features')
    || file.name.startsWith('genes')
  ) {
    fileType = FILE_TYPES.FEATURES;
  } else if (
    file.name.startsWith('barcodes')
  ) {
    fileType = FILE_TYPES.BARCODES;
  }

  if (!fileType) {
    return Verdict.INVALID_NAME;
  }

  // if name is valid, inspect first n bytes to validate format
  let data = await readFileToBuffer(file.slice(0, MIN_FILE_READ_LENGTH[fileType]));

  const isGzipped = !data.slice(0, 2).compare(GZIP_SIGNATURE);

  if (isGzipped) {
    // if gzipped, decompress a small chunk to further validate contents
    const gunzip = new Gunzip((chunk) => {
      data = Buffer.from(chunk.slice(0, MIN_FILE_READ_LENGTH[fileType]));
    });
    gunzip.push(await readFileToBuffer(file.slice(0, 128)));
  }

  const valid = isGzipped ? Verdict.VALID_ZIPPED : Verdict.VALID_UNZIPPED;

  // check matrix file starts with matrix signature
  if (fileType === FILE_TYPES.MATRIX
    && !data.slice(0, MATRIX_SIGNATURE.length).compare(MATRIX_SIGNATURE)) {
    return valid;
  }

  // check genes file starts with Ensembl Stable ID - ENS or "ENS
  if ((fileType === FILE_TYPES.FEATURES)
      && (
        !data.slice(0, 3).compare(FEATURES_SIGNATURE)
        || !data.slice(1, 4).compare(FEATURES_SIGNATURE)
        || !data.slice(0, 3).compare(FEATURES_NC_SIGNATURE)
        || !data.slice(1, 4).compare(FEATURES_NC_SIGNATURE)
      )
  ) {
    return valid;
  }

  // check barcodes file starts with a 10 digit DNA sequence
  if (fileType === FILE_TYPES.BARCODES
      && data.toString().match(/^[ACGT]+$/)) {
    return valid;
  }

  return Verdict.INVALID_FORMAT;
};

export {
  inspectFile,
  Verdict,
};
