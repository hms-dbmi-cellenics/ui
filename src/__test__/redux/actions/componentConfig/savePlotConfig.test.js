import { act } from 'react-dom/test-utils';

import '__test__/test-utils/mockWorkerBackend';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import { savePlotConfig } from 'redux/actions/componentConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import endUserMessages from 'utils/endUserMessages';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import fake from '__test__/test-utils/constants';

import config from 'config';
import { api } from 'utils/constants';

jest.mock('utils/pushNotificationMessage');

const mockStore = configureMockStore([thunk]);

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'cellSizeDistributionHistogramMain';
const plotType = 'cellSizeDistributionHistogram';

const state = {
  componentConfig: {
    [plotUuid]: {
      config: initialPlotConfigStates[plotType],
      plotData: [],
    },
  },
};

const store = mockStore(state);

describe('loadPlotConfig', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
  });

  it('Fires request to save config properly', async () => {
    await act(async () => {
      await store.dispatch(savePlotConfig(experimentId, plotUuid));
    });

    const url = fetchMock.mock.calls[0][0];
    expect(url).toEqual(`http://localhost:3000/v1/experiments/${experimentId}/plots-tables/${plotUuid}`);
  });

  it('Shows an error notification if saving fails', async () => {
    fetchMock.mockResponse(() => Promise.resolve({ status: 500, body: JSON.stringify('Server error') }));

    await act(async () => {
      await store.dispatch(savePlotConfig(experimentId, plotUuid));
    });

    // Expect componentConfig to contain key for plotUuid
    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith('error', endUserMessages.ERROR_SAVING_PLOT_CONFIG);
  });

  it('Uses V2 URL when using API version V2', async () => {
    config.currentApiVersion = api.V2;

    await act(async () => {
      await store.dispatch(savePlotConfig(experimentId, plotUuid));
    });

    const url = fetchMock.mock.calls[0][0];
    expect(url).toEqual(`http://localhost:3000/v2/experiments/${experimentId}/plots/${plotUuid}`);
  });
});
