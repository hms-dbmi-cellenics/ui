import { Gunzip } from 'fflate';

import { sampleTech } from 'utils/constants';
import techOptions from 'utils/upload/fileUploadSpecifications';
import readFileToBuffer from 'utils/upload/readFileToBuffer';

const Verdict = {
  INVALID_NAME: -2,
  INVALID_FORMAT: -1,
  VALID_ZIPPED: 0,
  VALID_UNZIPPED: 1,
};

const MATRIX_SIGNATURE = Buffer.from('%%MatrixMarket');

const GZIP_SIGNATURE = Buffer.from([0x1f, 0x8b]);

const inspectFile = async (file, technology) => {
  // Validate a file requested for upload to the platform.

  if (technology === sampleTech.RHAPSODY) {
    if (!file.name.toLowerCase().includes('expression_data.st')) {
      return Verdict.INVALID_NAME;
    }

    const data = await readFileToBuffer(file.slice(0, 16));
    const isGzipped = !data.slice(0, 2).compare(GZIP_SIGNATURE);
    const valid = isGzipped ? Verdict.VALID_ZIPPED : Verdict.VALID_UNZIPPED;
    return valid;
  } if (technology === sampleTech['10X']) {
    // immediately discard file if filename is not in valid set
    if (!techOptions[technology].isNameValid(file.name)) {
      return Verdict.INVALID_NAME;
    }

    // if name is valid, inspect first 16 bytes to validate format
    let data = await readFileToBuffer(file.slice(0, 16));

    const isGzipped = !data.slice(0, 2).compare(GZIP_SIGNATURE);

    if (isGzipped) {
      // if gzipped, decompress a small chunk to further validate contents
      const gunzip = new Gunzip((chunk) => {
        data = Buffer.from(chunk.slice(0, 16));
      });
      gunzip.push(await readFileToBuffer(file.slice(0, 128)));
    }

    const valid = isGzipped ? Verdict.VALID_ZIPPED : Verdict.VALID_UNZIPPED;

    // check matrix file starts with matrix signature
    if (file.name.match(/.*(matrix.mtx|matrix.mtx.gz)$/i)
      && !data.slice(0, MATRIX_SIGNATURE.length).compare(MATRIX_SIGNATURE)) {
      return valid;
    }

    // gene/non-coding IDs can be in many formats so we don't validate features
    if (file.name.match(/.*(genes.tsv|genes.tsv.gz|features.tsv|features.tsv.gz)$/i)) {
      return valid;
    }

    // check barcodes file starts with a 16 digit DNA sequence
    if (file.name.match(/.*(barcodes.tsv|barcodes.tsv.gz)$/i)
      && !data.toString().match(/\t/)) {
      return valid;
    }

    return Verdict.INVALID_FORMAT;
  }
  return Verdict.INVALID_FORMAT;
};

export {
  inspectFile,
  Verdict,
};
