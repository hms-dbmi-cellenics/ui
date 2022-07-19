import {
  DecodeUTF8, Decompress,
} from 'fflate';

const verdictMessage = {
  invalidBarcodesFile: (expected, found) => `Invalid barcodes.tsv file. ${expected} barcodes expected, but ${found} found.`,
  invalidFeaturesFile: (expected, found) => `Invalid features/genes.tsv file. ${expected} genes expected, but ${found} found.`,
  transposedMatrixFile: () => 'Invalid matrix.mtx file: Matrix is transposed.',
};

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

  const fileArrBuffer = await fileObject.slice(0, 300).arrayBuffer();

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

const getNumLines = async (sampleFile) => {
  const { compressed, fileObject } = sampleFile;
  const arrBuffer = await fileObject.arrayBuffer();

  const fileStr = compressed
    ? await decode(await decompress(arrBuffer))
    : await decode(arrBuffer);

  const numLines = (fileStr.match(/\n|\r\n/g) || []).length;

  return numLines;
};

const validateFileSizes = async (sample) => {
  const barcodes = sample.files['barcodes.tsv.gz'] || sample.files['barcodes.tsv'];
  const features = sample.files['features.tsv.gz'] || sample.files['features.tsv'] || sample.files['genes.tsv.gz'] || sample.files['genes.tsv'];
  const matrix = sample.files['matrix.mtx.gz'] || sample.files['matrix.mtx'];

  const {
    barcodeSize: expectedNumBarcodes,
    featuresSize: expectedNumFeatures,
  } = await extractSampleSizes(matrix);

  const numBarcodeFound = await getNumLines(barcodes);
  const numFeaturesFound = await getNumLines(features);

  const verdict = [];
  const valid = numBarcodeFound === expectedNumBarcodes && numFeaturesFound === expectedNumFeatures;

  const isSampleTransposed = numBarcodeFound === expectedNumFeatures
    && numFeaturesFound === expectedNumBarcodes;
  const isBarcodesInvalid = numBarcodeFound !== expectedNumBarcodes;
  const isFeaturesInvalid = numFeaturesFound !== expectedNumFeatures;

  if (isSampleTransposed) {
    verdict.push(verdictMessage.transposedMatrixFile());
    return { valid, verdict };
  }

  if (isBarcodesInvalid) {
    verdict.push(
      verdictMessage.invalidBarcodesFile(expectedNumBarcodes, numBarcodeFound),
    );
  }

  if (isFeaturesInvalid) {
    verdict.push(
      verdictMessage.invalidFeaturesFile(expectedNumFeatures, numFeaturesFound),
    );
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
  verdictMessage,
};
