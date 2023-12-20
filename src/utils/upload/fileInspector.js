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

const isGzipped = async (file) => {
  const data = await readFileToBuffer(file.slice(0, 16));
  const hasGzipSignature = !data.slice(0, 2).compare(GZIP_SIGNATURE);
  return hasGzipSignature ? Verdict.VALID_ZIPPED : Verdict.VALID_UNZIPPED;
};

const inspectFile = async (file, technology) => {
  if (Object.values(sampleTech).includes(technology)
    && !techOptions[technology].isNameValid(file.name)) {
    return Verdict.INVALID_NAME;
  }

  // Validate a file requested for upload to the platform.
  if (technology === sampleTech['10X']) {
    return inspect10XFile(file);
  } if (technology === sampleTech.SEURAT) {
    // only extension is checked
    return Verdict.VALID_ZIPPED;
  } if (technology === sampleTech.RHAPSODY) {
    // TODO: check why we would forbid non-gzipped files
    return inspectRhapsodyFile(file);
  } if (technology === sampleTech.H5) {
    return inspectH5File(file);
  } if (technology === sampleTech.PARSE) {
    // TODO: look into adding validation
    return inspectParseFile(file);
  }

  return Verdict.INVALID_FORMAT;
};

const inspectH5File = async (file) => {
  if (!techOptions[sampleTech.H5].isNameValid(file.name)) {
    return Verdict.INVALID_NAME;
  }
  return await isGzipped(file);
};

const inspect10XFile = async (file) => {
  // if name is valid, inspect first 16 bytes to validate format

  let data = await readFileToBuffer(file.slice(0, 16));
  const verdict = await isGzipped(file);

  if (verdict === Verdict.VALID_ZIPPED) {
    // if gzipped, decompress a small chunk to further validate contents
    const gunzip = new Gunzip((chunk) => {
      data = Buffer.from(chunk.slice(0, 16));
    });
    gunzip.push(await readFileToBuffer(file.slice(0, 128)));
  }

  // check matrix file starts with matrix signature
  if (file.name.match(/.*(matrix.mtx|matrix.mtx.gz)$/i)
    && !data.slice(0, MATRIX_SIGNATURE.length).compare(MATRIX_SIGNATURE)) {
    return verdict;
  }

  // gene/non-coding IDs can be in many formats so we don't validate features
  if (file.name.match(/.*(genes.tsv|genes.tsv.gz|features.tsv|features.tsv.gz)$/i)) {
    return verdict;
  }

  // check barcodes file starts with a 16 digit DNA sequence
  if (file.name.match(/.*(barcodes.tsv|barcodes.tsv.gz)$/i)
    && !data.toString().match(/\t/)) {
    return verdict;
  }

  return Verdict.INVALID_FORMAT;
};

const inspectRhapsodyFile = async (file) => await isGzipped(file);

const inspectParseFile = async (file) => await isGzipped(file);

export {
  inspectFile,
  Verdict,
};
