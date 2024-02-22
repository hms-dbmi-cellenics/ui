import _ from 'lodash';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import waitForActions from 'redux-mock-store-await-actions';
import axios from 'axios';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { waitFor } from '@testing-library/react';

import {
  SAMPLES_CREATED, SAMPLES_FILE_UPDATE, SAMPLES_SAVED, SAMPLES_SAVING, SAMPLES_VALIDATING_UPDATED,
} from 'redux/actionTypes/samples';
import initialSampleState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialExperimentState, { experimentTemplate } from 'redux/reducers/experiments/initialState';

import UploadStatus from 'utils/upload/UploadStatus';

import processSampleUpload from 'utils/upload/processSampleUpload';

import validate10x from 'utils/upload/validate10x';
import validateParse from 'utils/upload/validateParse';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { sampleTech } from 'utils/constants';
import mockFile from '__test__/test-utils/mockFile';

enableFetchMocks();

const getValidFiles = (selectedSampleTech, optionals = {}) => {
  const { cellrangerVersion = null, compressed = true } = optionals;

  let featuresFileName;
  let barcodesFileName;
  let matrixFileName;

  let featuresPathPrefix;
  let barcodesPathPrefix;
  let matrixPathPrefix;

  if (selectedSampleTech === sampleTech['10X']) {
    featuresFileName = cellrangerVersion === 'v2' ? 'genes.tsv.gz' : 'features.tsv.gz';
    barcodesFileName = 'barcodes.tsv.gz';
    matrixFileName = 'matrix.mtx.gz';

    featuresPathPrefix = 'WT13';
    barcodesPathPrefix = 'WT13';
    matrixPathPrefix = 'WT13';
  } else if (selectedSampleTech === sampleTech.PARSE) {
    featuresFileName = 'all_genes.csv.gz';
    barcodesFileName = 'cell_metadata.csv.gz';
    matrixFileName = 'DGE.mtx.gz';

    featuresPathPrefix = 'WT13/DGE_unfiltered';
    barcodesPathPrefix = 'WT13/DGE_filtered';
    matrixPathPrefix = 'WT13/DGE_unfiltered';
  } else {
    throw new Error(`${selectedSampleTech} not implemented`);
  }

  let fileList = [
    {
      name: `${featuresFileName}`,
      fileObject: mockFile(featuresFileName, featuresPathPrefix),
      upload: { status: UploadStatus.UPLOADING },
      errors: '',
      compressed,
      valid: true,
    },
    {
      name: barcodesFileName,
      fileObject: mockFile(barcodesFileName, barcodesPathPrefix),
      upload: { status: UploadStatus.UPLOADING },
      errors: '',
      compressed,
      valid: true,
    },
    {
      name: matrixFileName,
      fileObject: mockFile(matrixFileName, matrixPathPrefix),
      upload: { status: UploadStatus.UPLOADING },
      errors: '',
      compressed,
      valid: true,
    },
  ];

  fileList = fileList.map((file) => ({ ...file, size: file.fileObject.size }));
  return fileList;
};

const mockSampleUuid = 'sample-uuid';
const mockExperimentId = 'project-uuid';
const sampleName = 'mockSampleName';

const mockUnrelatedSampleUuid = 'unrelated-sample-uuid';
const mockUnrelatedExperimentId = 'unrelated-experiment-id';

const initialState = {
  experiments: {
    ...initialExperimentState,
    [mockExperimentId]: {
      ...experimentTemplate,
      id: mockExperimentId,
      sampleIds: [mockSampleUuid],
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
    [mockUnrelatedSampleUuid]: {
      ...sampleTemplate,
      uuid: mockUnrelatedSampleUuid,
      name: sampleName,
      experimentId: mockUnrelatedExperimentId,
    },
  },
};

const mockStore = configureMockStore([thunk]);

const sampleFileId = 'mockSampleFileId';

jest.mock('uuid', () => ({
  v4: jest.fn(() => sampleFileId),
}));

jest.mock('axios', () => ({
  request: jest.fn(),
}));

jest.mock('utils/pushNotificationMessage');

jest.mock('utils/upload/validate10x');
jest.mock('utils/upload/validateParse');

let store = null;

const mockProcessUploadCalls = () => {
  const sampleId = 'mockSampleId';

  const uploadId = 'some_id';
  const bucket = 'biomage-originals-test-accountId';
  const key = sampleFileId;

  const mockUploadUrlParams = { uploadId, bucket, key };

  fetchMock.mockIf(/.*/, ({ url }) => {
    let result;

    if (url.endsWith(`/v2/experiments/${mockExperimentId}/samples`)) {
      result = { status: 200, body: JSON.stringify({ WT13: sampleId }) };
    }

    // Create sample file
    if (new RegExp(`/v2/experiments/${mockExperimentId}/samples/.*/sampleFiles/.*`).test(url)) {
      result = { status: 200, body: JSON.stringify({}) };
    }

    // Update sample file status
    if (new RegExp(`/v2/experiments/${mockExperimentId}/sampleFiles/.*`).test(url)) {
      result = { status: 200, body: JSON.stringify({}) };
    }

    if (url.endsWith(`/v2/experiments/${mockExperimentId}/sampleFiles/${sampleFileId}/beginUpload`)) {
      result = { status: 200, body: JSON.stringify(mockUploadUrlParams) };
    }

    const queryParams = new URLSearchParams({ bucket, key });
    if (url.endsWith(`/v2/experiments/${mockExperimentId}/upload/${uploadId}/part/1/signedUrl?${queryParams}`)) {
      result = { status: 200, body: JSON.stringify('theSignedUrl') };
    }

    if (url.endsWith('/v2/completeMultipartUpload')) {
      result = { status: 200, body: JSON.stringify({}) };
    }

    return Promise.resolve(result);
  });
};

describe.each([
  { selectedSampleTech: sampleTech.PARSE, cellrangerVersion: null },
  { selectedSampleTech: sampleTech['10X'], cellrangerVersion: 'v2' },
  { selectedSampleTech: sampleTech['10X'], cellrangerVersion: 'v3' },
])('processUpload $selectedSampleTech, $cellrangerVersion', ({ selectedSampleTech, cellrangerVersion }) => {
  beforeEach(() => {
    jest.clearAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();
    mockProcessUploadCalls();

    validate10x.mockReset().mockImplementation(() => { });
    validateParse.mockReset().mockImplementation(() => { });

    store = mockStore(initialState);
  });

  it('Uploads and updates redux correctly when there are no errors', async () => {
    const filesList = getValidFiles(selectedSampleTech, { cellrangerVersion });

    const mockAxiosCalls = [];
    const uploadSuccess = (params) => {
      mockAxiosCalls.push(params);
      return Promise.resolve({ headers: { etag: 'etag-blah' }, PartNumber: 1 });
    };

    axios.request.mockImplementationOnce(uploadSuccess)
      .mockImplementationOnce(uploadSuccess)
      .mockImplementationOnce(uploadSuccess);

    await processSampleUpload(
      filesList,
      selectedSampleTech,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // Wait for uploads to be made
    await waitForActions(
      store,
      new Array(3).fill({
        type: SAMPLES_FILE_UPDATE,
      }),
      { matcher: waitForActions.matchers.containing },
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

    // Order is respected, SAMPLES_CREATED runs *before* SAMPLES_FILE_UPDATE
    expect(_.map(store.getActions(), 'type')).toEqual([
      ...Array(2).fill(SAMPLES_VALIDATING_UPDATED),
      SAMPLES_SAVING, SAMPLES_CREATED, SAMPLES_SAVED,
      ...Array(6).fill(SAMPLES_FILE_UPDATE),
    ]);

    // There are 3 files actions with status uploading
    expect(uploadingStatusProperties.length).toEqual(3);
    // There are 3 files actions with status uploaded
    expect(uploadedStatusProperties.length).toEqual(3);

    // Three axios put calls are made, one single part for each
    // because the files fit in a single chunk
    expect(mockAxiosCalls.length).toBe(3);
    // Each put call is made with the correct information
    expect(mockAxiosCalls[0].data).toBeInstanceOf(Buffer);
    expect(mockAxiosCalls[1].data).toBeInstanceOf(Buffer);
    expect(mockAxiosCalls[2].data).toBeInstanceOf(Buffer);

    // axios request calls are correct
    expect(axios.request.mock.calls.map((call) => _.omit(call[0], 'data'))).toMatchSnapshot();

    // If we trigger axios onUploadProgress it updates the progress correctly
    axios.request.mock.calls[0][0].onUploadProgress({ progress: 0.5 });

    await waitForActions(
      store,
      [{
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOADING, progress: 50 } } },
      }],
      { matcher: waitForActions.matchers.containing },
    );

    await waitForActions(
      store,
      [{
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOADED } } },
      }],
      { matcher: waitForActions.matchers.containing },
    );

    expect(fetchMock.mock.calls).toMatchSnapshot('fetch calls');
  });

  it('Updates redux correctly when there are file upload errors', async () => {
    const mockAxiosCalls = [];

    const uploadError = (params) => {
      mockAxiosCalls.push(params);
      return Promise.reject(new Error('Error'));
    };

    axios.request.mockImplementation(uploadError);

    await processSampleUpload(
      getValidFiles(selectedSampleTech, { cellrangerVersion }),
      selectedSampleTech,
      store.getState().samples,
      mockExperimentId,
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
    expect(uploadingFileProperties.length).toEqual(3);
    // There are 3 files actions with status upload error
    expect(errorFileProperties.length).toEqual(3);
    // There are no file actions with status successfully uploaded
    expect(uploadedFileProperties.length).toEqual(0);

    expect(fetchMock.mock.calls).toMatchSnapshot('fetch calls');
  });

  it('Should not upload files if there are errors creating samples in the api', async () => {
    fetchMock.mockReject(new Error('Error'));

    await processSampleUpload(
      getValidFiles(selectedSampleTech, { cellrangerVersion }),
      selectedSampleTech,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // We do not expect uploads to happen
    await waitFor(() => {
      expect(axios.request).not.toHaveBeenCalled();
    });

    expect(fetchMock.mock.calls).toMatchSnapshot('fetch calls');

    // Informs user of error
    expect(pushNotificationMessage).toHaveBeenCalledWith('error', 'We couldn\'t create your sample. Please try uploading it again');
  });

  it('Should not upload files if there are errors beginning the multipart upload in the api', async () => {
    const sampleId = 'mockSampleId';

    fetchMock.mockIf(/.*/, ({ url }) => {
      let result;

      if (url.endsWith(`/v2/experiments/${mockExperimentId}/samples`)) {
        result = { status: 200, body: JSON.stringify({ WT13: sampleId }) };
      }

      if (new RegExp(`/v2/experiments/${mockExperimentId}/samples/.*/sampleFiles/.*`).test(url)) {
        result = { status: 200, body: JSON.stringify({}) };
      }

      if (url.endsWith(`/v2/experiments/${mockExperimentId}/sampleFiles/${sampleFileId}/beginUpload`)) {
        return Promise.reject(new Error('Some error in the api'));
      }

      return Promise.resolve(result);
    });

    await processSampleUpload(
      getValidFiles(selectedSampleTech, { cellrangerVersion }),
      selectedSampleTech,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    await waitForActions(
      store,
      new Array(3).fill({
        type: SAMPLES_FILE_UPDATE,
        payload: { fileDiff: { upload: { status: UploadStatus.UPLOAD_ERROR } } },
      }),
      { matcher: waitForActions.matchers.containing },
    );

    // Uploads didn't begin
    expect(axios.request).not.toHaveBeenCalled();

    expect(fetchMock.mock.calls).toMatchSnapshot('fetch calls');
  });

  it('Should not upload sample and show notification if uploaded sample is invalid', async () => {
    validate10x.mockImplementationOnce(
      () => { throw new Error('Some file error'); },
    );

    validateParse.mockImplementationOnce(
      () => { throw new Error('Some file error'); },
    );

    await processSampleUpload(
      getValidFiles(selectedSampleTech, { cellrangerVersion }),
      selectedSampleTech,
      store.getState().samples,
      mockExperimentId,
      store.dispatch,
    );

    // We do not expect uploads to happen
    await waitFor(() => {
      expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
      expect(axios.request).not.toHaveBeenCalled();
    });
  });
});
