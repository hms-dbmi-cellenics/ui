import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import {
  EXPERIMENT_SETTINGS_PROCESSING_SAVE,
} from '../../../../redux/actionTypes/experimentSettings';
import saveProcessingSettings from '../../../../redux/actions/experimentSettings/saveProcessingSettings';
import initialState from '../../../../redux/reducers/experimentSettings/initialState';

jest.mock('localforage');

const mockStore = configureStore([thunk]);

enableFetchMocks();

describe('saveProcessingSettings', () => {
  const experimentId = '1234';
  const settingName = 'test';

  const mockState = {
    experimentSettings: {
      ...initialState,
    },
  };

  const response = new Response(JSON.stringify({}));

  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValue(response);
  });

  it('Dispatches action when called', async () => {
    const store = mockStore(mockState);
    await store.dispatch(saveProcessingSettings(experimentId, settingName));

    const action = store.getActions();
    expect(action.length).toEqual(1);
    expect(action[0].type).toEqual(EXPERIMENT_SETTINGS_PROCESSING_SAVE);
  });
});
