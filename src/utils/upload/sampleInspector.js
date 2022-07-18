import {
  DecodeUTF8, Decompress,
} from 'fflate';

const Verdict = {
  INVALID_BARCODES_FILE: 'INVALID_SAMPLE_FILES',
  INVALID_FEATURES_FILE: 'INVALID_FEATURES_FILE',
  INVALID_TRANSPOSED_MATRIX: 'INVALID_TRANSPOSED_MATRIX',
};

const verdictText = {
  [Verdict.INVALID_BARCODES_FILE]: 'Barcodes file is invalid',
  [Verdict.INVALID_FEATURES_FILE]: 'Features file is invalid',
  [Verdict.INVALID_TRANSPOSED_MATRIX]: 'Matrix file is transposed',
};

const CHUNK_SIZE = 2 ** 18; // 250 kb

const decode = async (arrBuffer) => {
  let result = '';
  const utfDecode = new DecodeUTF8((data) => { result += data; });
  utfDecode.push(new Uint8Array(arrBuffer));

  return result;
};

const decompress = async (arrBuffer) => {
  let result = '';
  const decompressor = new Decompress((chunk) => { result = chunk; });
  decompressor.push(new Uint8Array(arrBuffer));

  return result;
};

const extractSampleSizes = async (matrix) => {
  const { compressed, fileObject } = matrix;
  let header = '';
  let matrixHeader = '';

  const fileArrBuffer = await fileObject.slice(0, 500).arrayBuffer();

  matrixHeader = compressed
    ? await decode(await decompress(fileArrBuffer))
    : await decode(fileArrBuffer);

  // The matrix header is the first line in the file that splits into 3
  header = matrixHeader.split('\n').find((line) => line.split(' ').length === 3);

  const [featuresSize, barcodeSize] = header.split(' ');
  return {
    featuresSize: Number.parseInt(featuresSize, 10),
    barcodeSize: Number.parseInt(barcodeSize, 10),
  };
};

const countLine = async (fileObject, start, compressed) => {
  const end = Math.min(start + CHUNK_SIZE, fileObject.size);
  const arrBuffer = await fileObject.slice(start, end).arrayBuffer();
  const fileStr = compressed
    ? await decode(await decompress(arrBuffer))
    : await decode(arrBuffer);

  const numLines = (fileStr.match(/\n|\r\n/g) || []).length;

  return numLines;
};

const getNumLines = async (sampleFile) => {
  let pointer = 0;
  const counterJobs = [];

  const { compressed, fileObject } = sampleFile;

  while (pointer < fileObject.size) {
    counterJobs.push(countLine(fileObject, pointer, compressed));
    pointer += CHUNK_SIZE;
  }

  const resultingCounts = await Promise.all(counterJobs);
  const numLines = resultingCounts.reduce((count, numLine) => count + numLine, 0);
  return numLines;
};

const validateFileSizes = async (sample) => {
  const barcodes = sample.files['barcodes.tsv.gz'] || sample.files['barcodes.tsv'];
  const features = sample.files['features.tsv.gz'] || sample.files['features.tsv'];
  const matrix = sample.files['matrix.mtx.gz'] || sample.files['matrix.mtx'];

  const { barcodeSize, featuresSize } = await extractSampleSizes(matrix);

  const numBarcodeLines = await getNumLines(barcodes);
  const numFeaturesLines = await getNumLines(features);

  const verdict = [];
  const valid = numBarcodeLines === barcodeSize && numFeaturesLines === featuresSize;

  const isSampleTransposed = numBarcodeLines === featuresSize && numFeaturesLines === barcodeSize;
  const isBarcodesInvalid = numBarcodeLines !== barcodeSize;
  const isFeaturesInvalid = numFeaturesLines !== featuresSize;

  if (isSampleTransposed) { verdict.push(Verdict.INVALID_TRANSPOSED_MATRIX); } else {
    if (isBarcodesInvalid) verdict.push(Verdict.INVALID_BARCODES_FILE);
    if (isFeaturesInvalid) verdict.push(Verdict.INVALID_FEATURES_FILE);
  }

  return { valid, verdict };
};

const validationTests = [
  validateFileSizes,
];

const inspectSample = async (sample) => {
  // The promises return [{ valid: ..., verdict: ... }, ... ]
  const validationPromises = validationTests
    .map(async (validationFn) => await validationFn(sample));

  const result = await Promise.all(validationPromises);

  // This transforms it into { valid: ..., verdict: [...] },
  const { valid, verdict } = result.reduce((acc, curr) => ({
    valid: acc.valid && curr.valid,
    verdict: [
      ...acc.verdict,
      ...curr.verdict,
    ],
  }), { valid: true, verdict: [] });

  return { valid, verdict };
};

export {
  inspectSample,
  Verdict,
  verdictText,
};
