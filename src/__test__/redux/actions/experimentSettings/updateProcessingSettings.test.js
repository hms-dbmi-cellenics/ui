import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
} from '../../../../redux/actionTypes/experimentSettings';
import updateProcessingSettings from '../../../../redux/actions/experimentSettings/updateProcessingSettings';
import initialState from '../../../test-utils/experimentSettings.mock';

jest.mock('localforage');

const mockStore = configureStore([thunk]);

describe('saveProcessingSettings', () => {
  const experimentId = '1234';
  const settingName = 'test';

  const mockState = {
    experimentSettings: {
      ...initialState,
    },
  };

  it('Dispatches action when called', async () => {
    const store = mockStore(mockState);
    store.dispatch(updateProcessingSettings(experimentId, settingName));

    const action = store.getActions();
    expect(action.length).toEqual(1);
    expect(action[0].type).toEqual(EXPERIMENT_SETTINGS_PROCESSING_UPDATE);
  });
});
