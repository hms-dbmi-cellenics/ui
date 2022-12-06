import {
  DecodeUTF8, Decompress,
} from 'fflate';
import SampleValidationError from 'utils/errors/upload/SampleValidationError';
import { decode, decompress } from 'utils/upload/decompressionUtils';

const errorMessages = {
  invalidBarcodesFile: (expected, found) => `Invalid barcodes.tsv file: ${expected} barcodes expected, but ${found} found.`,
  invalidFeaturesFile: (expected, found) => `Invalid features/genes.tsv file: ${expected} genes expected, but ${found} found.`,
  transposedMatrixFile: () => 'Invalid matrix.mtx file: Matrix is transposed.',
  missingFiles: (missingFiles) => `Incomplete sample: Sample does not contain "${missingFiles.join('" and "')}" file(s). Please include the file in the sample.`,
  invalidMatrixFormat: (type) => {
    let errMessage = 'Invalid matrix.mtx file: Invalid matrix format type';
    if (type === 'array') errMessage = 'Invalid matrix.mtx file: Matrix file format is "array". Please convert to sparse "coordinate" format.';
    return errMessage;
  },
};

const CHUNK_SIZE = 2 ** 18; // 256 kB

const extractSampleSizes = (matrixHead) => {
  // The size line is the first line in the file that does not begin with a comment (%)
  const sizeLine = matrixHead.split('\n').find((line) => line[0] !== '%');

  const [featuresSize, barcodeSize, matrixSize] = sizeLine.split(' ');
  return [
    Number.parseInt(featuresSize, 10),
    Number.parseInt(barcodeSize, 10),
    Number.parseInt(matrixSize, 10),
  ];
};
const getNumLines = async (sampleFile) => {
  const { compressed, fileObject } = sampleFile;

  let numLines = 0;

  // Streaming UTF-8 decoder
  const utfDecode = new DecodeUTF8((data) => {
    numLines += (data.match(/\n|\r\n/g) || []).length;
  });
  // Streaming Decompression (auto-detect the compression method)
  const dcmpStrm = new Decompress((chunk, final) => {
    utfDecode.push(chunk, final);
  });

  // if the file is compressed we use the decompressor on top of the utfDecoder
  // otherwise, just use the utfDecoder
  const decoder = compressed ? dcmpStrm : utfDecode;

  let idx = 0;
  while (idx + CHUNK_SIZE < fileObject.size) {
    // eslint-disable-next-line no-await-in-loop
    const slice = await fileObject.slice(idx, idx + CHUNK_SIZE).arrayBuffer();
    decoder.push(new Uint8Array(slice));
    idx += CHUNK_SIZE;
  }
  const finalSlice = await fileObject.slice(idx, fileObject.size).arrayBuffer();
  decoder.push(new Uint8Array(finalSlice), true);

  return numLines;
};

const getMatrixHead = async (matrix) => {
  const { compressed, fileObject } = matrix;

  let matrixHeader = '';

  const fileArrBuffer = await fileObject.slice(0, 300).arrayBuffer();

  matrixHeader = compressed
    ? await decode(await decompress(fileArrBuffer))
    : await decode(fileArrBuffer);

  return matrixHeader;
};

const getSampleFiles = (sample) => {
  const barcodes = sample.files['barcodes.tsv.gz'] || sample.files['barcodes.tsv'];
  const features = sample.files['features.tsv.gz'] || sample.files['features.tsv'] || sample.files['genes.tsv.gz'] || sample.files['genes.tsv'];
  const matrix = sample.files['matrix.mtx.gz'] || sample.files['matrix.mtx'];

  return { barcodes, features, matrix };
};

const validateSampleCompleteness = async (sampleFiles) => {
  const { barcodes, features, matrix } = sampleFiles;

  const missingFiles = [];

  if (!barcodes) missingFiles.push('barcodes');
  if (!features) missingFiles.push('features');
  if (!matrix) missingFiles.push('matrix');

  if (missingFiles.length) {
    throw new SampleValidationError(errorMessages.missingFiles(missingFiles));
  }
};

const validateMatrixFormat = async (sampleFiles) => {
  const { matrix } = sampleFiles;

  const matrixHead = await getMatrixHead(matrix);

  // Reject sample if type of count matrix is "array" not "coordinate"
  // See https://networkrepository.com/mtx-matrix-market-format.html
  const headerLine = matrixHead.split('\n')[0];

  if (headerLine.match('array')) throw new SampleValidationError(errorMessages.invalidMatrixFormat('array'));
  if (!headerLine.match('coordinate')) throw new SampleValidationError(errorMessages.invalidMatrixFormat());
};

const validateFileSizes = async (sampleFiles) => {
  const { barcodes, features, matrix } = sampleFiles;
  const errors = [];

  const matrixHead = await getMatrixHead(matrix);

  const [
    expectedNumFeatures,
    expectedNumBarcodes,
  ] = extractSampleSizes(matrixHead);

  const numBarcodesFound = await getNumLines(barcodes);
  const numFeaturesFound = await getNumLines(features);

  if (numBarcodesFound === expectedNumFeatures
    && numFeaturesFound === expectedNumBarcodes) {
    errors.push(errorMessages.transposedMatrixFile());
  }

  if (numBarcodesFound !== expectedNumBarcodes) {
    errors.push(
      errorMessages.invalidBarcodesFile(expectedNumBarcodes, numBarcodesFound),
    );
  }

  if (numFeaturesFound !== expectedNumFeatures) {
    errors.push(
      errorMessages.invalidFeaturesFile(expectedNumFeatures, numFeaturesFound),
    );
  }

  if (errors.length) throw new SampleValidationError(errors.join('\n'));
};

const validate10x = async (sample) => {
  const sampleFiles = getSampleFiles(sample);

  await validateSampleCompleteness(sampleFiles);
  await validateMatrixFormat(sampleFiles);
  await validateFileSizes(sampleFiles);
};

export default validate10x;
