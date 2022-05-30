import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import {
  EXPERIMENT_SETTINGS_PROCESSING_SAVE,
} from 'redux/actionTypes/experimentSettings';
import { api } from 'utils/constants';
import config from 'config';

import saveProcessingSettings from 'redux/actions/experimentSettings/processingConfig/saveProcessingSettings';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

import '__test__/test-utils/setupTests';

const mockStore = configureStore([thunk]);

enableFetchMocks();

const initialExperimentState = generateExperimentSettingsMock([]);

describe('saveProcessingSettings', () => {
  const experimentId = '1234';
  const settingName = 'test';

  const mockState = {
    experimentSettings: {
      ...initialExperimentState,
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

  it('Works with apiv2', async () => {
    config.currentApiVersion = api.V2;
    const store = mockStore(mockState);
    await store.dispatch(saveProcessingSettings(experimentId, settingName));
    expect(fetchMock).toHaveBeenCalledWith(`http://localhost:3000/v2/experiments/${experimentId}/processingConfig`,
      { body: `[{"name":"${settingName}"}]`, headers: { 'Content-Type': 'application/json' }, method: 'PUT' });
  });
});
