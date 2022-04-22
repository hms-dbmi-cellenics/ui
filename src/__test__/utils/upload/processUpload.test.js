import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import waitForActions from 'redux-mock-store-await-actions';
import axios from 'axios';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { SAMPLES_FILE_UPDATE } from 'redux/actionTypes/samples';
import initialSampleState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialProjectState, { projectTemplate } from 'redux/reducers/projects/initialState';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';
import processUpload from 'utils/upload/processUpload';
import UploadStatus from 'utils/upload/UploadStatus';
import { waitFor } from '@testing-library/dom';

enableFetchMocks();

const validFilesList = [
  {
    name: 'WT13/features.tsv.gz',
    fileObject: {
      name: 'features.tsv.gz',
      path: '/WT13/features.tsv.gz',
      type: 'application/gzip',
      size: 100,
    },
    upload: { status: UploadStatus.UPLOADING },
    errors: '',
    compressed: true,
    valid: true,
  },
  {
    name: 'WT13/barcodes.tsv.gz',
    fileObject: {
      name: 'barcodes.tsv.gz',
      path: '/WT13/barcodes.tsv.gz',
      type: 'application/gzip',
      size: 100,
    },
    upload: { status: UploadStatus.UPLOADING },
    errors: '',
    compressed: true,
    valid: true,
  },
  {
    name: 'WT13/matrix.mtx.gz',
    fileObject: {
      name: 'matrix.mtx.gz',
      path: '/WT13/matrix.mtx.gz',
      type: 'application/gzip',
      size: 100,
    },
    upload: { status: UploadStatus.UPLOADING },
    errors: '',
    compressed: true,
    valid: true,
  },
];

const sampleType = '10X Chromium';
const mockSampleUuid = 'sample-uuid';
const mockProjectUuid = 'project-uuid';
const mockExperimentId = 'experiment-id';

const initialState = {
  projects: {
    ...initialProjectState,
    ids: [mockProjectUuid],
    meta: {
      activeProjectUuid: mockProjectUuid,
    },
    [mockProjectUuid]: {
      ...projectTemplate,
      samples: [mockSampleUuid],
      experiments: [mockExperimentId],
    },
    errorProjectUuid: {
      ...projectTemplate,
      samples: [mockSampleUuid],
      experiments: [mockExperimentId],
    },
  },
  experiments: {
    ...initialExperimentState,
    [mockExperimentId]: {
      ...experimentTemplate,
      id: mockExperimentId,
    },
  },
  samples: {
    ...initialSampleState,
    ids: [mockSampleUuid],
    meta: {
      loading: true,
      error: false,
    },
    [mockSampleUuid]: {
      ...sampleTemplate,
      uuid: [mockSampleUuid],
      projectUuid: mockProjectUuid,
    },
  },
};
// Based on https://stackoverflow.com/a/51045733
const flushPromises = () => new Promise(setImmediate);
const mockStore = configureMockStore([thunk]);

jest.mock('utils/upload/loadAndCompressIfNecessary',
  () => jest.fn().mockImplementation(
    (file) => {
      if (!file.valid) {
        return Promise.reject(new Error('error'));
      }
      return Promise.resolve('loadedGzippedFile');
    },
  ));

jest.mock('redux/actions/samples/saveSamples', () => jest.fn().mockImplementation(() => ({
  type: 'samples/saved',
})));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'sample-uuid'),
}));

jest.mock('axios', () => ({
  request: jest.fn(),
}));

jest.mock('redux/actions/samples/deleteSamples', () => ({
  sendDeleteSamplesRequest: jest.fn(),
}));

let store = null;

describe('processUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify('theSignedUrl'), { status: 200 });

    store = mockStore(initialState);
  });

  it('Uploads and updates redux correctly when there are no errors', async () => {
    const mockAxiosCalls = [];
    const uploadSuccess = (params) => {
      mockAxiosCalls.push(params);
      return Promise.resolve('Resolved');
    };

    axios.request.mockImplementationOnce(uploadSuccess)
      .mockImplementationOnce(uploadSuccess)
      .mockImplementationOnce(uploadSuccess);

    await processUpload(
      validFilesList,
      sampleType,
      store.getState().samples,
      mockProjectUuid,
      store.dispatch,
    );

    // Wait for uploads to be made
    await waitForActions(
      store,
      new Array(3).fill({
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOADED } } },
      }),
      { matcher: waitForActions.matchers.containing },
    );

    // Three axios put calls are made
    expect(mockAxiosCalls.length).toBe(3);
    // Each put call is made with the correct information
    expect(mockAxiosCalls[0].data).toEqual('loadedGzippedFile');
    expect(mockAxiosCalls[1].data).toEqual('loadedGzippedFile');
    expect(mockAxiosCalls[2].data).toEqual('loadedGzippedFile');

    // Wait until all put promises are resolved
    await flushPromises();
    const fileUpdateActions = store.getActions().filter(
      (action) => action.type === SAMPLES_FILE_UPDATE,
    );
    const uploadProperties = fileUpdateActions.map((action) => action.payload.fileDiff.upload);
    const uploadingStatusProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADING,
    );
    const uploadedStatusProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADED,
    );
    // There are 6 files actions with status uploading
    expect(uploadingStatusProperties.length).toEqual(6);
    // There are 3 files actions with status uploaded
    expect(uploadedStatusProperties.length).toEqual(3);
    // After uploading ends successfully the upload promises are removed
    uploadedStatusProperties.forEach(({ amplifyPromise }) => {
      expect(amplifyPromise).toBeNull();
    });
  });

  it('Updates redux correctly when there are file load and compress errors', async () => {
    const invalidFiles = validFilesList.map((file) => ({ ...file, valid: false }));

    await processUpload(
      invalidFiles,
      sampleType,
      store.getState().samples,
      mockProjectUuid,
      store.dispatch,
    );

    // Wait for uploads to be made
    await waitForActions(
      store,
      new Array(3).fill({
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.FILE_READ_ERROR } } },
      }),
      { matcher: waitForActions.matchers.containing },
    );

    const fileUpdateActions = store.getActions().filter(
      (action) => action.type === SAMPLES_FILE_UPDATE,
    );

    const uploadProperties = fileUpdateActions.map((action) => action.payload.fileDiff.upload);

    const uploadingFileProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADING,
    );
    const errorFileProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.FILE_READ_ERROR,
    );
    const uploadedFileProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADED,
    );
    // There are 3 files actions with status uploading
    expect(uploadingFileProperties.length).toEqual(3);
    // There are 3 files actions with status upload error
    expect(errorFileProperties.length).toEqual(3);
    // There are no file actions with status successfully uploaded
    expect(uploadedFileProperties.length).toEqual(0);
  });

  it('Updates redux correctly when there are file upload errors', async () => {
    const mockAxiosCalls = [];

    const uploadError = (params) => {
      mockAxiosCalls.push(params);
      return Promise.reject(new Error('Error'));
    };

    axios.request.mockImplementationOnce(uploadError)
      .mockImplementationOnce(uploadError)
      .mockImplementationOnce(uploadError);

    await processUpload(
      validFilesList,
      sampleType,
      store.getState().samples,
      'errorProjectUuid',
      store.dispatch,
    );

    // Wait for uploads to be made
    await waitForActions(
      store,
      new Array(3).fill({
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOAD_ERROR } } },
      }),
      { matcher: waitForActions.matchers.containing },
    );

    const fileUpdateActions = store.getActions().filter(
      (action) => action.type === SAMPLES_FILE_UPDATE,
    );

    const uploadProperties = fileUpdateActions.map((action) => action.payload.fileDiff.upload);

    const uploadingFileProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADING,
    );

    const errorFileProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOAD_ERROR,
    );

    const uploadedFileProperties = uploadProperties.filter(
      ({ status }) => status === UploadStatus.UPLOADED,
    );

    // There are 3 files actions with status uploading
    expect(uploadingFileProperties.length).toEqual(6);
    // There are 3 files actions with status upload error
    expect(errorFileProperties.length).toEqual(3);
    // There are no file actions with status successfully uploaded
    expect(uploadedFileProperties.length).toEqual(0);
    // Upload end deletes aws promise (if there was one)
    errorFileProperties.forEach(({ amplifyPromise }) => {
      expect(amplifyPromise).toBeNull();
    });
  });

  it('Should not upload files if there are errors creating samples in DynamoDB', async () => {
    fetchMock.mockReject(new Error('Error'));

    await processUpload(
      validFilesList,
      sampleType,
      store.getState().samples,
      mockProjectUuid,
      store.dispatch,
    );

    // We do not expect uploads to happen
    await waitFor(() => {
      expect(axios.request).not.toHaveBeenCalled();
    });
  });
});
