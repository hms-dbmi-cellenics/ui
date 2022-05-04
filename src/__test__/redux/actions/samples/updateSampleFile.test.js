import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import UploadStatus from 'utils/upload/UploadStatus';
import updateSampleFile from 'redux/actions/samples/updateSampleFile';
import initialState, { sampleTemplate, sampleFileTemplate } from 'redux/reducers/samples/initialState';
import { saveSamples } from 'redux/actions/samples';

import { SAMPLES_FILE_UPDATE } from 'redux/actionTypes/samples';

jest.mock('redux/actions/samples/saveSamples');
saveSamples.mockImplementation(() => async () => { });

const mockStartTime = '4022-01-01T00:00:00.000Z';
const mockEndTime = '4021-01-01T00:00:00.000Z';

const mockStore = configureStore([thunk]);
jest.mock('moment', () => () => jest.requireActual('moment')(mockEndTime));

describe('updateSampleFile action', () => {
  const fileName = 'file-1';
  const mockUuid = 'abc123';

  const mockFile = {
    ...sampleFileTemplate,
    name: fileName,
  };

  const mockSample = {
    ...sampleTemplate,
    name: 'test sample',
    uuid: mockUuid,
    lastModified: mockStartTime,
    filesNames: [fileName],
    files: { [fileName]: mockFile },
  };

  const mockState = {
    samples: {
      ...initialState,
      [mockSample.uuid]: mockSample,
    },
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateSampleFile(mockUuid, mockFile.name, mockFile));

    // action updates the files
    const secondAction = store.getActions()[0];
    expect(secondAction.type).toEqual(SAMPLES_FILE_UPDATE);
  });

  it('Updates the sample lastModified field', async () => {
    const originalModifiedDate = mockSample.lastModified;
    const store = mockStore(mockState);
    await store.dispatch(updateSampleFile(mockUuid, mockFile.name, mockFile));

    const { lastModified } = store.getActions()[0].payload;

    expect(lastModified).not.toEqual(originalModifiedDate);
    expect(lastModified).toEqual(mockEndTime);
  });

  it('Inserts file into sample', async () => {
    const store = mockStore(mockState);

    await store.dispatch(updateSampleFile(mockUuid, mockFile.name, mockFile));

    const { fileDiff } = store.getActions()[0].payload;

    expect(fileDiff.name).toEqual(fileName);
  });

  it('Does not dispatch call by default', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateSampleFile(mockUuid, mockFile.name, mockFile));

    expect(saveSamples).not.toHaveBeenCalled();
  });

  it('Dispatches call to save samples on upload success', async () => {
    const store = mockStore(mockState);

    const successFile = {
      ...mockFile,
      upload: {
        status: UploadStatus.UPLOADED,
      },
    };

    await store.dispatch(updateSampleFile(mockUuid, mockFile.name, successFile));

    // Dispatches sample file update action too
    expect(store.getActions()).toMatchSnapshot();

    expect(saveSamples).toHaveBeenCalled();
  });

  it('Dispatches call to save samples on upload error', async () => {
    const errorFile = {
      ...mockFile,
      upload: {
        status: UploadStatus.UPLOAD_ERROR,
      },
    };

    const store = mockStore(mockState);
    await store.dispatch(updateSampleFile(mockUuid, mockFile.name, errorFile));

    expect(saveSamples).toHaveBeenCalled();
  });
});
