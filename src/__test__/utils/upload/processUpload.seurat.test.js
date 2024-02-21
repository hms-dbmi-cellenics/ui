import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import waitForActions from 'redux-mock-store-await-actions';
import axios from 'axios';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { sampleTech } from 'utils/constants';
import { waitFor } from '@testing-library/react';

import { SAMPLES_FILE_UPDATE } from 'redux/actionTypes/samples';
import initialSampleState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

import UploadStatus from 'utils/upload/UploadStatus';

import processSampleUpload from 'utils/upload/processSampleUpload';

import validate from 'utils/upload/validateSeurat';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import mockFile from '__test__/test-utils/mockFile';

const FILE_SIZE = 1024 * 1024 * 15;

enableFetchMocks();

const getValidFiles = (compressed = true) => {
  const seuratFiles = [{
    name: 'r.rds',
    fileObject: mockFile('r.rds', '', FILE_SIZE),
    size: FILE_SIZE,
    upload: { status: UploadStatus.UPLOADING },
    errors: '',
    compressed,
    valid: true,
  }];

  return seuratFiles;
};

const sampleType = sampleTech.SEURAT;
const mockSampleUuid = 'sample-uuid';
const mockExperimentId = 'project-uuid';
const sampleName = 'mockSampleName';

const initialState = {
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
      uuid: mockSampleUuid,
      name: sampleName,
      experimentId: mockExperimentId,
    },
  },
};

const mockStore = configureMockStore([thunk]);

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'sample-uuid'),
}));

jest.mock('axios', () => ({
  request: jest.fn(),
}));

jest.mock('utils/pushNotificationMessage');
jest.mock('utils/upload/validateSeurat');

let store = null;

describe('processUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockUploadUrlParams = {
      signedUrls: ['theSignedUrl1', 'theSignedUrl2'],
      uploadId: 'some_id',
    };

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify(mockUploadUrlParams), { status: 200 });

    store = mockStore(initialState);
  });

  it('Uploads and updates redux correctly when there are no errors', async () => {
    const mockAxiosCalls = [];
    const uploadSuccess = (params) => {
      mockAxiosCalls.push(params);
      return Promise.resolve({ headers: { etag: 'etag-blah' } });
    };

    axios.request.mockImplementation(uploadSuccess);

    await processSampleUpload(
      getValidFiles(),
      sampleType,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // Wait for uploads to be made
    await waitForActions(
      store,
      new Array(1).fill({
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOADED } } },
      }),
      { matcher: waitForActions.matchers.containing },
    );

    // Two axios put calls are made (one for each presigned url)
    expect(mockAxiosCalls.length).toBe(2);
    // Each put call is made with the correct information
    expect(mockAxiosCalls[0].url).toBe('theSignedUrl1');
    expect(mockAxiosCalls[1].url).toBe('theSignedUrl2');

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

    // There are 1 files actions with status uploading
    expect(uploadingStatusProperties.length).toEqual(1);
    // There are 1 files actions with status uploaded
    expect(uploadedStatusProperties.length).toEqual(1);

    // axios request calls are correct
    expect(axios.request.mock.calls.map((call) => call[0])).toMatchSnapshot();

    // If we trigger axios onUploadProgress for the two presigned urls,
    // it updates the progress correctly
    axios.request.mock.calls[0][0].onUploadProgress({ loaded: FILE_SIZE / 4 });
    axios.request.mock.calls[1][0].onUploadProgress({ loaded: FILE_SIZE / 4 });

    await waitForActions(
      store,
      [{
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOADING, progress: 50 } } },
      }],
      { matcher: waitForActions.matchers.containing },
    );
  });

  it('Updates redux correctly when there are file upload errors', async () => {
    const mockAxiosCalls = [];

    const uploadError = (params) => {
      mockAxiosCalls.push(params);
      return Promise.reject(new Error('Error'));
    };

    axios.request.mockImplementation(uploadError);

    await processSampleUpload(
      getValidFiles(),
      sampleType,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // Wait for uploads to be made
    await waitForActions(
      store,
      new Array(1).fill({
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

    // There are 1 files actions with status uploading
    expect(uploadingFileProperties.length).toEqual(1);
    // There are 1 files actions with status upload error
    expect(errorFileProperties.length).toEqual(1);
    // There are no file actions with status successfully uploaded
    expect(uploadedFileProperties.length).toEqual(0);
  });

  it('Should not upload files if there are errors creating samples in the api', async () => {
    fetchMock.mockReject(new Error('Error'));

    await processSampleUpload(
      getValidFiles(),
      sampleType,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // We do not expect uploads to happen
    await waitFor(() => {
      expect(axios.request).not.toHaveBeenCalled();
    });
  });

  it('Should not validate .rds files', async () => {
    const mockAxiosCalls = [];
    const uploadSuccess = (params) => {
      mockAxiosCalls.push(params);
      return Promise.resolve({ headers: { etag: 'etag-blah' } });
    };

    axios.request.mockImplementation(uploadSuccess);

    validate.mockImplementationOnce(
      () => (['Some file error']),
    );

    await processSampleUpload(
      getValidFiles(),
      sampleType,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // We expect uploads to happen
    await waitFor(() => {
      expect();
      expect(pushNotificationMessage).toHaveBeenCalledTimes(0);
      expect(axios.request).toHaveBeenCalledTimes(2);
      expect(validate).toHaveBeenCalledTimes(1);
    });
  });
});
