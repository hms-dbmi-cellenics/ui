import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE,
} from '../../../../redux/actionTypes/experimentSettings';
import updateFilterSettings from '../../../../redux/actions/experimentSettings/processingConfig/updateFilterSettings';
import generateExperimentSettingsMock from '../../../test-utils/experimentSettings.mock';

jest.mock('localforage');

const mockStore = configureStore([thunk]);

const initialExperimentState = generateExperimentSettingsMock([]);

describe('saveProcessingSettings', () => {
  const mockState = {
    experimentSettings: {
      ...initialExperimentState,
    },
  };

  it('Dispatches action when called with a correct settingName', async () => {
    const settingName = 'dataIntegration';
    const store = mockStore(mockState);
    store.dispatch(updateFilterSettings(settingName));

    const action = store.getActions();
    expect(action.length).toEqual(1);
    expect(action[0].type).toEqual(EXPERIMENT_SETTINGS_NON_SAMPLE_FILTER_UPDATE);
  });

  it('Throws when called with invalid settingName', async () => {
    const settingName = 'test';
    const store = mockStore(mockState);

    try {
      store.dispatch(updateFilterSettings(settingName));

      // Had to add this disable because for some reason eslint doesn't realize fail exists
      // eslint-disable-next-line no-undef
      fail('Error was not thrown');
    } catch (e) {
      expect(e.message).toEqual(`Invalid step parameter received: ${settingName}`);
    }
  });
});
