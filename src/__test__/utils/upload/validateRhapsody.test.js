import validateRhapsody from 'utils/upload/validateRhapsody';
import initialState, { sampleFileTemplate, sampleTemplate } from 'redux/reducers/samples/initialState';

import * as fs from 'fs';

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
    'expression_data.st': 'src/__test__/data/mock_files/expressionData.st',
    'expression_data_invalid_column.st': 'src/__test__/data/mock_files/expressionDataInvalidColumn.st',
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

jest.mock('utils/upload/readFileToBuffer');

const mockUnzippedSample = {
  ...sampleTemplate,
  ...initialState,
  name: 'mockUnzippedSample',
  fileNames: [
    'expression_data.st',
  ],
  files: {
    'expression_data.st': {
      ...sampleFileTemplate,
      name: 'expression_data.st',
      fileObject: mockUnzippedFileObjects['expression_data.st'],
      size: mockUnzippedFileObjects['expression_data.st'].size,
      path: '/sample1/expression_data.st',
      compressed: false,
    },
  },
};

describe('validateRhapsody', () => {
  it('Correctly pass valid unzipped samples', async () => {
    await expect(validateRhapsody(mockUnzippedSample)).resolves.toBeUndefined();
  });

  it('Throws an error invalid column format', async () => {
    const mockInvalidColumn = _.cloneDeep(mockUnzippedSample);
    mockInvalidColumn.files['expression_data.st'].fileObject = mockUnzippedFileObjects['expression_data_invalid_column.st'];
    mockInvalidColumn.files['expression_data.st'].size = mockUnzippedFileObjects['expression_data_invalid_column.st'].size;

    await expect(validateRhapsody(mockInvalidColumn)).rejects.toThrowErrorMatchingSnapshot();
  });
});
