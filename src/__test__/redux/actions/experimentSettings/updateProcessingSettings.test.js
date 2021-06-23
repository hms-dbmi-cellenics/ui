import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
} from '../../../../redux/actionTypes/experimentSettings';
import updateProcessingSettings from '../../../../redux/actions/experimentSettings/updateProcessingSettings';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

jest.mock('localforage');

const mockStore = configureStore([thunk]);

const initialExperimentState = generateExperimentSettingsMock([]);

describe('saveProcessingSettings', () => {
  const settingName = 'test';

  const mockState = {
    experimentSettings: {
      ...initialExperimentState,
    },
  };

  it('Dispatches action when called', async () => {
    const store = mockStore(mockState);
    store.dispatch(updateProcessingSettings(settingName));

    const action = store.getActions();
    expect(action.length).toEqual(1);
    expect(action[0].type).toEqual(EXPERIMENT_SETTINGS_PROCESSING_UPDATE);
  });
});
