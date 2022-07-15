import {
  DecodeUTF8, Decompress,
} from 'fflate';

const Verdict = {
  INVALID_BARCODES_FILE: 'INVALID_SAMPLE_FILES',
  INVALID_FEATURES_FILE: 'INVALID_FEATURES_FILE',
  INVALID_SAMPLE_FILE_TRANSPOSED: 'INVALID_SAMPLE_FILE_TRANSPOSED',
};

const verdictText = {
  [Verdict.INVALID_BARCODES_FILE]: 'Barcodes file is invalid',
  [Verdict.INVALID_FEATURES_FILE]: 'Features file is invalid',
  [Verdict.INVALID_SAMPLE_FILE_TRANSPOSED]: 'Sample files are transposed',
};

const CHUNK_SIZE = 2 ** 18; // 250 kb

const decodeStream = async (fileSlice) => {
  const arrBuffer = await fileSlice.arrayBuffer();

  let result = '';
  const utfDecode = new DecodeUTF8((data) => { result += data; });
  utfDecode.push(new Uint8Array(arrBuffer));

  return result;
};

const decompressStream = async (fileSlice) => {
  const arrBuffer = await fileSlice.arrayBuffer();

  let result = '';
  const utfDecode = new DecodeUTF8((data) => { result += data; });
  const decompressor = new Decompress((chunk) => { utfDecode.push(chunk); });
  decompressor.push(new Uint8Array(arrBuffer));

  return result;
};

const extractSampleSizes = async (matrix) => {
  const { compressed, fileObject } = matrix;
  let header = '';
  let matrixHeader = '';

  const fileSlie = fileObject.slice(0, 500);

  matrixHeader = compressed
    ? await decompressStream(fileSlie)
    : await decodeStream(fileSlie);

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
  const fileSlice = fileObject.slice(start, end);

  const fileStr = compressed ? await decompressStream(fileSlice) : await decodeStream(fileSlice);
  let numLines = (fileStr.match(/\n|\r\n/g) || []).length;

  // Last character might not contain a new line char (\n), so the last line is not counted
  // Correct this by adding a line to the count if the last line is not \n
  if (fileSlice.size === CHUNK_SIZE) return numLines;

  const lastChar = fileStr[fileStr.length - 1];
  if (lastChar !== '\n') { numLines += 1; }
  return numLines;
};

const validateFileSize = async (sampleFile, expectedSize) => {
  let pointer = 0;

  const counterJobs = [];

  const { compressed, fileObject } = sampleFile;

  while (pointer < fileObject.size) {
    counterJobs.push(countLine(fileObject, pointer, compressed));
    pointer += CHUNK_SIZE;
  }

  const resultingCounts = await Promise.all(counterJobs);
  const numLines = resultingCounts.reduce((count, numLine) => count + numLine, 0);

  return numLines === expectedSize;
};

const validateFileSizes = async (sample) => {
  const barcodes = sample.files['barcodes.tsv.gz'] || sample.files['barcodes.tsv'];
  const features = sample.files['features.tsv.gz'] || sample.files['features.tsv'];
  const matrix = sample.files['matrix.mtx.gz'] || sample.files['matrix.mtx'];

  const { barcodeSize, featuresSize } = await extractSampleSizes(matrix);

  const isBarcodeValid = await validateFileSize(barcodes, barcodeSize);
  const isFeaturesValid = await validateFileSize(features, featuresSize);

  const valid = isBarcodeValid && isFeaturesValid;

  const verdict = [];
  if (!isBarcodeValid) verdict.push(Verdict.INVALID_BARCODES_FILE);
  if (!isFeaturesValid) verdict.push(Verdict.INVALID_FEATURES_FILE);

  return { valid, verdict };
};

const validationTests = [
  validateFileSizes,
];

const inspectSample = async (sample) => {
  console.log('*** sample', sample);
  console.log('*** inspecting sample', sample.name);

  // The promises return [{ valid: ..., verdict: ... }, ... ]
  const validationPromises = validationTests
    .map(async (validationFn) => await validationFn(sample));

  console.log(validationPromises);

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
  verdictText,
};
