import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import _ from 'lodash';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import {
  EXPERIMENT_SETTINGS_PROCESSING_LOAD,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
} from '../../../../redux/actionTypes/experimentSettings';
import loadProcessingSettings from '../../../../redux/actions/experimentSettings/loadProcessingSettings';
import initialState from '../../../test-utils/experimentSettings.mock';

import {
  NOTIFICATIONS_PUSH_MESSAGE,
} from '../../../../redux/actionTypes/notifications';

jest.mock('localforage');

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('loadProcessingSettings action', () => {
  const experimentId = '1234';

  const mockState = {
    experimentSettings: {
      ...initialState,
    },
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on normal operation', async () => {
    const state = _.merge(mockState, {
      experimentSettings: {
        processing: {
          meta: {
            loading: false,
            error: false,
          },
        },
      },
    });

    const store = mockStore(state);
    await store.dispatch(loadProcessingSettings(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches action on initial state', async () => {
    const state = _.merge(mockState, {
      experimentSettings: {
        processing: {
          meta: {
            loading: true,
            error: false,
          },
        },
      },
    });
    const store = mockStore(state);

    await store.dispatch(loadProcessingSettings(experimentId));

    const actions = store.getActions();

    expect(actions.length).toEqual(1);
    expect(actions[0].type).toEqual(EXPERIMENT_SETTINGS_PROCESSING_LOAD);
  });

  it('Correctly sets error if returned an error', async () => {
    fetchMock.resetMocks();
    fetchMock.mockReject(new Error('some weird error that happened'));

    const store = mockStore(mockState);
    await store.dispatch(loadProcessingSettings(experimentId));

    const actions = store.getActions();

    expect(actions.length).toEqual(2);

    expect(actions[0].type).toEqual(NOTIFICATIONS_PUSH_MESSAGE);
    expect(actions[1].type).toEqual(EXPERIMENT_SETTINGS_PROCESSING_ERROR);
  });

  it('Redispatches if called on error', async () => {
    const state = _.merge(mockState, {
      experimentSettings: {
        processing: {
          meta: {
            loading: false,
            loadingSettingsError: true,
          },
        },
      },
    });

    const store = mockStore(state);
    await store.dispatch(loadProcessingSettings(experimentId));

    const actions = store.getActions();
    expect(actions.length).toEqual(1);
    expect(actions[0].type).toEqual(EXPERIMENT_SETTINGS_PROCESSING_LOAD);
  });
});
