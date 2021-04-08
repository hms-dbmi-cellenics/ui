import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import updateSampleFile from '../../../../redux/actions/samples/updateSampleFile';
import initialState, { sampleTemplate, sampleFileTemplate } from '../../../../redux/reducers/samples/initialState';

import { SAMPLES_FILE_UPDATE } from '../../../../redux/actionTypes/samples';

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
    [fileName]: mockFile,
  };

  const mockState = {
    samples: {
      ...initialState,
      ids: [...initialState.ids, mockSample.uuid],
      [mockSample.uuid]: mockSample,
    },
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateSampleFile(mockUuid, mockSample));

    // action updates the files
    const secondAction = store.getActions()[0];
    expect(secondAction.type).toEqual(SAMPLES_FILE_UPDATE);
  });

  it('Updates the sample lastModified field', async () => {
    const originalModifiedDate = mockSample.lastModified;
    const store = mockStore(mockState);
    await store.dispatch(updateSampleFile(mockUuid, mockFile));

    const { lastModified } = store.getActions()[0].payload;

    expect(lastModified).not.toEqual(originalModifiedDate);
    expect(lastModified).toEqual(mockEndTime);
  });

  it('Inserts file into sample', async () => {
    const store = mockStore(mockState);

    await store.dispatch(updateSampleFile(mockUuid, {
      mockFile,
      name: fileName,
    }));
    const { file } = store.getActions()[0].payload;
    expect(file.name).toEqual(fileName);
  });
});
