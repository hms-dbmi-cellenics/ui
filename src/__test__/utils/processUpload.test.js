import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import waitForActions from 'redux-mock-store-await-actions';

import { Storage } from 'aws-amplify';
import { SAMPLES_FILE_UPDATE } from '../../redux/actionTypes/samples';

import processUpload from '../../utils/processUpload';
import UploadStatus from '../../utils/UploadStatus';

const validFilesList = [
  {
    name: 'WT13/features.tsv.gz',
    bundle: {
      name: 'features.tsv.gz',
      path: '/WT13/features.tsv.gz',
      type: 'application/gzip',
      valid: true,
    },
    upload: { status: UploadStatus.UPLOADING },
    errors: '',
  },
  {
    name: 'WT13/barcodes.tsv.gz',
    bundle: {
      name: 'features.tsv.gz',
      path: '/WT13/barcodes.tsv.gz',
      type: 'application/gzip',
      valid: true,
    },
    upload: { status: UploadStatus.UPLOADING },
    errors: '',
  },
  {
    name: 'WT13/matrix.mtx.gz',
    bundle: {
      name: 'features.tsv.gz',
      path: '/WT13/matrix.mtx.gz',
      type: 'application/gzip',
      valid: true,
    },
    upload: { status: UploadStatus.UPLOADING },
    errors: '',
  },
];

const sampleType = '10X Chromium';

const samples = {
  ids: [],
  meta: {
    loading: true,
    error: false,
  },
};

const activeProjectUuid = 'activeProjectUuid';

const mockStore = configureMockStore([thunk]);

jest.mock('../../utils/loadAndCompressIfNecessary',
  () => jest.fn().mockImplementation(
    (bundle) => {
      if (!bundle.valid) {
        return Promise.reject(new Error('error'));
      }

      return Promise.resolve('loadedGzippedFile');
    },
  ));

jest.mock('../../utils/environment', () => ({
  __esModule: true,
  isBrowser: () => false,
  ssrGetCurrentEnvironment: () => 'development',
}));

let mockStorageCalls = [];

Storage.put = jest.fn().mockImplementation(
  (bucketKey, file) => {
    mockStorageCalls.push({ bucketKey, file });
    if (bucketKey.includes('errorProjectUuid')) {
      return Promise.reject(new Error());
    }

    return Promise.resolve(null);
  },
);

describe('processUpload (in development)', () => {
  afterEach(() => {
    mockStorageCalls = [];
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // eslint-disable-next-line no-param-reassign
    validFilesList.forEach((file) => { file.bundle.valid = true; });
  });

  it('Uploads and updates redux correctly when there are no errors', async () => {
    const store = mockStore({
      projects: {
        [activeProjectUuid]: {
          samples: [],
        },
      },
    });

    processUpload(validFilesList, sampleType, samples, activeProjectUuid, store.dispatch);

    await waitForActions(
      store,
      new Array(6).fill(SAMPLES_FILE_UPDATE),
      { matcher: waitForActions.matchers.containing },
    );

    // Three Storage.put calls are made
    expect(mockStorageCalls.length).toBe(3);

    // Each put call is made with the correct information
    expect(mockStorageCalls[0].file).toEqual('loadedGzippedFile');
    expect(mockStorageCalls[1].file).toEqual('loadedGzippedFile');
    expect(mockStorageCalls[2].file).toEqual('loadedGzippedFile');

    const fileUpdateActions = store.getActions().filter(
      (action) => action.type === SAMPLES_FILE_UPDATE,
    );

    const filesStatuses = fileUpdateActions.map((action) => action.payload.fileDiff.upload.status);

    const uploadingFileStatuses = filesStatuses.filter(
      (status) => status === UploadStatus.UPLOADING,
    );

    const uploadedFilesStatuses = filesStatuses.filter(
      (status) => status === UploadStatus.UPLOADED,
    );

    // The first 3 files actions are with status uploading
    uploadingFileStatuses.forEach((status) => {
      expect(status).toEqual(UploadStatus.UPLOADING);
    });

    // After uploading ends successfully the statuses are uploaded
    uploadedFilesStatuses.forEach((status) => {
      expect(status).toEqual(UploadStatus.UPLOADED);
    });
  });

  it('Updates redux correctly when there are file load and compress errors', async () => {
    const store = mockStore({
      projects: {
        [activeProjectUuid]: {
          samples: [],
        },
      },
    });

    // eslint-disable-next-line no-param-reassign
    validFilesList.forEach((file) => { file.bundle.valid = false; });

    processUpload(validFilesList, sampleType, samples, activeProjectUuid, store.dispatch);

    await waitForActions(
      store,
      new Array(6).fill(SAMPLES_FILE_UPDATE),
      { matcher: waitForActions.matchers.containing },
    );

    const fileUpdateActions = store.getActions().filter(
      (action) => action.type === SAMPLES_FILE_UPDATE,
    );

    const filesStatuses = fileUpdateActions.map((action) => action.payload.fileDiff.upload.status);

    const uploadingFileStatuses = filesStatuses.filter(
      (status) => status === UploadStatus.UPLOADING,
    );

    const errorFileStatuses = filesStatuses.filter(
      (status) => status === UploadStatus.FILE_READ_ERROR,
    );

    // There are 3 files actions with status uploading
    expect(uploadingFileStatuses.length).toEqual(6);

    // There are 3 files actions with status upload error
    expect(errorFileStatuses.length).toEqual(3);
  });

  it('Updates redux correctly when there are file upload errors', async () => {
    const store = mockStore({
      projects: {
        errorProjectUuid: {
          samples: [],
        },
      },
    });

    processUpload(validFilesList, sampleType, samples, 'errorProjectUuid', store.dispatch);

    await waitForActions(
      store,
      new Array(6).fill(SAMPLES_FILE_UPDATE),
      { matcher: waitForActions.matchers.containing, throttleWait: 2 },
    );

    const fileUpdateActions = store.getActions().filter(
      (action) => action.type === SAMPLES_FILE_UPDATE,
    );

    const filesStatuses = fileUpdateActions.map((action) => action.payload.fileDiff.upload.status);

    const uploadingFileStatuses = filesStatuses.filter(
      (status) => status === UploadStatus.UPLOADING,
    );

    const errorFileStatuses = filesStatuses.filter(
      (status) => status === UploadStatus.UPLOAD_ERROR,
    );

    // There are 3 files actions with status uploading
    expect(uploadingFileStatuses.length).toEqual(6);

    // There are 3 files actions with status upload error
    expect(errorFileStatuses.length).toEqual(3);
  });
});
