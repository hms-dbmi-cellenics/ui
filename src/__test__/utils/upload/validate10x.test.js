import validate10x from 'utils/upload/validate10x';
import initialState, { sampleFileTemplate, sampleTemplate } from 'redux/reducers/samples/initialState';

import * as fs from 'fs';
import sampleFileType from 'utils/sampleFileType';

const _ = require('lodash');

// A function which returns an object to emulate the Blob class
// Required because NodeJS's implementation of Blob modifies the
// data, causing it to be irreproducible in the test
const makeBlob = (data) => ({
  data,
  size: data.length,
  slice(start, end) { return makeBlob(data.slice(start, end)); },
  arrayBuffer() { return new Promise((resolve) => resolve(data.buffer)); },
});

const mockFileLocations = {
  unziped: {
    'barcodes.tsv': 'src/__test__/data/mock_files/barcodes.tsv',
    'features.tsv': 'src/__test__/data/mock_files/features.tsv',
    'matrix.mtx': 'src/__test__/data/mock_files/matrix.mtx',
  },
  zipped: {
    'barcodes.tsv.gz': 'src/__test__/data/mock_files/barcodes.tsv.gz',
    'features.tsv.gz': 'src/__test__/data/mock_files/features.tsv.gz',
    'matrix.mtx.gz': 'src/__test__/data/mock_files/matrix.mtx.gz',
    'invalid_barcodes.tsv.gz': 'src/__test__/data/mock_files/invalidBarcodes.tsv.gz',
    'invalid_features.tsv.gz': 'src/__test__/data/mock_files/invalidFeatures.tsv.gz',
    'transposed_matrix.mtx.gz': 'src/__test__/data/mock_files/transposedMatrix.mtx.gz',
    'matrix_array_format.mtx.gz': 'src/__test__/data/mock_files/matrixArrayFormat.mtx.gz',
    'matrix_invalid_format.mtx.gz': 'src/__test__/data/mock_files/matrixNonExistentFormat.mtx.gz',
  },
};

// Manually resolve fflate import for Jest the module definition for fflate
// because it does not correctly resolve to the intended module
jest.mock('fflate', () => {
  const realModule = jest.requireActual('../../../../node_modules/fflate/umd/index.js');

  return {
    _esModule: true,
    ...realModule,
  };
});

const prepareMockFiles = (fileLocations) => {
  const errors = {};

  // Read and prepare each file object
  Object.entries(fileLocations).forEach(([filename, location]) => {
    const fileUint8Arr = new Uint8Array(fs.readFileSync(location));
    errors[filename] = makeBlob(fileUint8Arr);
  });

  return errors;
};

const mockUnzippedFileObjects = prepareMockFiles(mockFileLocations.unziped);
const mockZippedFileObjects = prepareMockFiles(mockFileLocations.zipped);

jest.mock('utils/upload/readFileToBuffer');

const mockZippedSample = {
  ...sampleTemplate,
  ...initialState,
  name: 'mockZippedSample',
  files: {
    [sampleFileType.FEATURES_10_X]: {
      ...sampleFileTemplate,
      fileObject: mockZippedFileObjects['features.tsv.gz'],
      size: mockZippedFileObjects['features.tsv.gz'].size,
      compressed: true,
    },
    [sampleFileType.BARCODES_10_X]: {
      ...sampleFileTemplate,
      fileObject: mockZippedFileObjects['barcodes.tsv.gz'],
      size: mockZippedFileObjects['barcodes.tsv.gz'].size,
      compressed: true,
    },
    [sampleFileType.MATRIX_10_X]: {
      ...sampleFileTemplate,
      fileObject: mockZippedFileObjects['matrix.mtx.gz'],
      size: mockZippedFileObjects['matrix.mtx.gz'].size,
      compressed: true,
    },
  },
};

const mockUnzippedSample = {
  ...sampleTemplate,
  ...initialState,
  name: 'mockUnzippedSample',
  files: {
    [sampleFileType.FEATURES_10_X]: {
      ...sampleFileTemplate,
      fileObject: mockUnzippedFileObjects['features.tsv'],
      size: mockUnzippedFileObjects['features.tsv'].size,
      compressed: false,
    },
    [sampleFileType.BARCODES_10_X]: {
      ...sampleFileTemplate,
      fileObject: mockUnzippedFileObjects['barcodes.tsv'],
      size: mockUnzippedFileObjects['barcodes.tsv'].size,
      compressed: false,
    },
    [sampleFileType.MATRIX_10_X]: {
      ...sampleFileTemplate,
      fileObject: mockUnzippedFileObjects['matrix.mtx'],
      size: mockUnzippedFileObjects['matrix.mtx'].size,
      compressed: false,
    },
  },
};

describe('validate10x', () => {
  it('Correctly pass valid zipped samples', async () => {
    await expect(validate10x(mockZippedSample)).resolves.toBeUndefined();
  });

  it('Correctly pass valid unzipped samples', async () => {
    await expect(validate10x(mockUnzippedSample)).resolves.toBeUndefined();
  });

  it('Throws an error for missing barcodes file', async () => {
    const missingBarcodesFile = _.cloneDeep(mockZippedSample);

    delete missingBarcodesFile.files[sampleFileType.BARCODES_10_X];

    await expect(validate10x(missingBarcodesFile)).rejects.toThrowErrorMatchingSnapshot();
  });

  it('Throws an error for missing features file', async () => {
    const missingFeaturesFile = _.cloneDeep(mockZippedSample);
    delete missingFeaturesFile.files[sampleFileType.FEATURES_10_X];

    await expect(validate10x(missingFeaturesFile)).rejects.toThrowErrorMatchingSnapshot();
  });

  it('Throws an error for missing matrix file', async () => {
    const missingMatrixFile = _.cloneDeep(mockZippedSample);
    delete missingMatrixFile.files[sampleFileType.MATRIX_10_X];
  });

  it('Throws an error matrix with array format', async () => {
    const mockMatrixArrayFormat = _.cloneDeep(mockZippedSample);
    mockMatrixArrayFormat.files[sampleFileType.MATRIX_10_X].fileObject = mockZippedFileObjects['matrix_array_format.mtx.gz'];
    mockMatrixArrayFormat.files[sampleFileType.MATRIX_10_X].size = mockZippedFileObjects['matrix_array_format.mtx.gz'].size;

    await expect(validate10x(mockMatrixArrayFormat)).rejects.toThrowErrorMatchingSnapshot();
  });

  it('Throws an error invalid matrix format', async () => {
    const mockMatrixNonExistentFormat = _.cloneDeep(mockZippedSample);
    mockMatrixNonExistentFormat.files[sampleFileType.MATRIX_10_X].fileObject = mockZippedFileObjects['matrix_invalid_format.mtx.gz'];
    mockMatrixNonExistentFormat.files[sampleFileType.MATRIX_10_X].size = mockZippedFileObjects['matrix_invalid_format.mtx.gz'].size;

    await expect(validate10x(mockMatrixNonExistentFormat)).rejects.toThrowErrorMatchingSnapshot();
  });

  it('Throws an error for invalid barcodes file', async () => {
    const mockInvalidBarcodesFile = _.cloneDeep(mockZippedSample);
    mockInvalidBarcodesFile.files[sampleFileType.BARCODES_10_X].fileObject = mockZippedFileObjects['invalid_barcodes.tsv.gz'];
    mockInvalidBarcodesFile.files[sampleFileType.BARCODES_10_X].size = mockZippedFileObjects['invalid_barcodes.tsv.gz'].size;

    await expect(validate10x(mockInvalidBarcodesFile)).rejects.toThrowErrorMatchingSnapshot();
  });

  it('Throws an error for invalid features file', async () => {
    const mockInvalidFeaturesFile = _.cloneDeep(mockZippedSample);
    mockInvalidFeaturesFile.files[sampleFileType.FEATURES_10_X].fileObject = mockZippedFileObjects['invalid_features.tsv.gz'];
    mockInvalidFeaturesFile.files[sampleFileType.FEATURES_10_X].size = mockZippedFileObjects['invalid_features.tsv.gz'].size;

    await expect(validate10x(mockInvalidFeaturesFile)).rejects.toThrowErrorMatchingSnapshot();
  });

  it('Throws an error for transposed matrix file', async () => {
    const mockTransposedFile = _.cloneDeep(mockZippedSample);
    mockTransposedFile.files[sampleFileType.MATRIX_10_X].fileObject = mockZippedFileObjects['transposed_matrix.mtx.gz'];
    mockTransposedFile.files[sampleFileType.MATRIX_10_X].size = mockZippedFileObjects['transposed_matrix.mtx.gz'].size;

    await expect(validate10x(mockTransposedFile)).rejects.toThrowErrorMatchingSnapshot();
  });
});
