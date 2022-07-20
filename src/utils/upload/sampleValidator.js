import {
  DecodeUTF8, Decompress,
} from 'fflate';

const errorMessages = {
  invalidBarcodesFile: (expected, found) => `Invalid barcodes.tsv file. ${expected} barcodes expected, but ${found} found.`,
  invalidFeaturesFile: (expected, found) => `Invalid features/genes.tsv file. ${expected} genes expected, but ${found} found.`,
  invalidMatrixFile: (expected, found) => `Invalid matrix.tsv file. ${expected} elements expected, but ${found} found.`,
  transposedMatrixFile: () => 'Invalid matrix.mtx file: Matrix is transposed.',
};

const CHUNK_SIZE = 2 ** 18; // 256 kB

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

  console.log('HEADER: ', header);
  const [featuresSize, barcodeSize, matrixSize] = header.split(' ');
  // const [featuresSize, barcodeSize, matrixSize] = header.split(' ');
  return [Number.parseInt(featuresSize, 10),
    Number.parseInt(barcodeSize, 10),
    Number.parseInt(matrixSize, 10)];
  // matrixSize: Number.parseInt(matrixSize, 10),
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

  // console.log('decoder object: ', decoder);
  console.log('file object size: ', fileObject.size);
  let idx = 0;
  while (idx + CHUNK_SIZE < fileObject.size) {
    console.log('Indices: ', idx, idx + CHUNK_SIZE);
    // eslint-disable-next-line no-await-in-loop
    const slice = await fileObject.slice(idx, idx + CHUNK_SIZE).arrayBuffer();
    // console.log('slice', slice);
    decoder.push(new Uint8Array(slice));
    idx += CHUNK_SIZE;
  }
  const finalSlice = await fileObject.slice(idx, fileObject.size).arrayBuffer();
  // console.log('final slice', finalSlice);
  decoder.push(new Uint8Array(finalSlice), true);
  // dcmpStrm.push(fileObject, true);

  console.log('NUM lines: ', numLines);

  return numLines;
};

const validateFileSizes = async (sample) => {
  const barcodes = sample.files['barcodes.tsv.gz'] || sample.files['barcodes.tsv'];
  const features = sample.files['features.tsv.gz'] || sample.files['features.tsv'] || sample.files['genes.tsv.gz'] || sample.files['genes.tsv'];
  const matrix = sample.files['matrix.mtx.gz'] || sample.files['matrix.mtx'];

  const [
    expectedNumFeatures,
    expectedNumBarcodes,
    // expectedMatrixSize,
  ] = await extractSampleSizes(matrix);

  const numBarcodesFound = await getNumLines(barcodes);
  const numFeaturesFound = await getNumLines(features);
  // const numMatrixLinesFound = await getNumLines(matrix);

  const errors = [];

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

  // if ((numMatrixLinesFound - 2) !== expectedMatrixSize) {
  //   errors.push(
  //     errorMessages.invalidMatrixFile(expectedMatrixSize, numMatrixLinesFound),
  //   );
  // }

  return errors;
};

const validate = async (sample) => {
  const errors = await validateFileSizes(sample);
  console.log('errors: ', errors);
  return errors;
};

export default validate;
