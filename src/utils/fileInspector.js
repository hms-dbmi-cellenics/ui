import { Gunzip, strFromU8 } from 'fflate';

import techOptions from './fileUploadSpecifications';
import readFileToBuffer from './readFileToBuffer';

const Verdict = {
  INVALID_NAME: -2,
  INVALID_FORMAT: -1,
  VALID_ZIPPED: 0,
  VALID_UNZIPPED: 1,
};

const MATRIX_SIGNATURE = Buffer.from('%%MatrixMarket', 'ascii');
const FEATURES_SIGNATURE = Buffer.from('ENS', 'ascii');

const GZIP_SIGNATURE = Buffer.from([0x1f, 0x8b]);

const inspectFile = async (file, technology) => {
  // Validate a file requested for upload to the platform.

  // immediately discard file if filename is not in valid set
  const validNames = techOptions[technology].acceptedFiles;
  if (!validNames.has(file.name)) {
    return Verdict.INVALID_NAME;
  }

  // if name is valid, inspect first 16 bytes to validate format
  let data = await readFileToBuffer(file.slice(0, 16));

  const isGzipped = !data.slice(0, 2).compare(GZIP_SIGNATURE);

  if (isGzipped) {
    // if gzipped, decompress a small chunk to further validate contents
    // eslint-disable-next-line no-unused-vars
    const gunzip = new Gunzip((chunk, _) => {
      data = Buffer.from(chunk.slice(0, 16));
    });
    gunzip.push(await readFileToBuffer(file.slice(0, 128)));
  }

  const valid = isGzipped ? Verdict.VALID_ZIPPED : Verdict.VALID_UNZIPPED;

  // check matrix file starts with matrix signature
  if (file.name.startsWith('matrix')
    && !data.slice(0, MATRIX_SIGNATURE.length).compare(MATRIX_SIGNATURE)) {
    return valid;
  }

  // check genes file starts with Ensembl Stable ID - ENS or "ENS
  if ((file.name.startsWith('features') || file.name.startsWith('genes'))
      && (!data.slice(0, 3).compare(FEATURES_SIGNATURE)
      || !data.slice(1, 4).compare(FEATURES_SIGNATURE))) {
    return valid;
  }

  // check barcodes file starts with a 16 digit DNA sequence
  if (file.name.startsWith('barcodes')
      && strFromU8(data).match(/^[ACGT]+$/)) {
    return valid;
  }

  return Verdict.INVALID_FORMAT;
};

export {
  inspectFile,
  Verdict,
};
