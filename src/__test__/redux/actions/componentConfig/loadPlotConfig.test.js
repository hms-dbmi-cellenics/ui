import { act } from 'react-dom/test-utils';
import _ from 'lodash';

import '__test__/test-utils/mockWorkerBackend';

import { makeStore } from 'redux/store';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import { loadPlotConfig } from 'redux/actions/componentConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

import endUserMessages from 'utils/endUserMessages';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import fake from '__test__/test-utils/constants';

jest.mock('utils/pushNotificationMessage');

let testStore = null;

enableFetchMocks();

const experimentId = fake.EXPERIMENT_ID;
const plotUuid = 'cellSizeDistributionHistogramMain';
const plotType = 'cellSizeDistributionHistogram';

const mockData = {
  plotData: [1, 2, 3, 4],
  config: {},
};

const mockConfigData = _.merge({}, initialPlotConfigStates[plotType], mockData);

describe('loadPlotConfig', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fetchMock.resetMocks();
    testStore = makeStore();
  });

  it('Loads config properly', async () => {
    fetchMock.mockResponse(() => Promise.resolve(new Response(JSON.stringify(mockConfigData))));

    await act(async () => {
      await testStore.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    });

    // Hits the correct url
    const fetchUrl = fetchMock.mock.calls[0][0];
    expect(fetchUrl).toEqual(`http://localhost:3000/v2/experiments/${experimentId}/plots/${plotUuid}`);

    // Expect componentConfig to contain key for plotUuid
    expect(testStore.getState().componentConfig[plotUuid]).toBeDefined();

    const plotConfig = testStore.getState().componentConfig[plotUuid];

    expect(plotConfig).toMatchSnapshot();
  });

  it('Loads default initial config for plots if plot config is not found', async () => {
    fetchMock.mockResponse(() => Promise.resolve({ status: 404, body: JSON.stringify('Plot config not found') }));

    await act(async () => {
      await testStore.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    });

    // Expect componentConfig to contain key for plotUuid
    expect(testStore.getState().componentConfig[plotUuid]).toBeDefined();

    const plotConfig = testStore.getState().componentConfig[plotUuid];

    expect(plotConfig).toMatchSnapshot();
  });

  it('Non-200 response shows an error message', async () => {
    fetchMock.mockResponse(() => Promise.resolve({ status: 500, body: JSON.stringify('Server error') }));

    await act(async () => {
      await testStore.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    });

    // Expect componentConfig to contain key for plotUuid
    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith('error', endUserMessages.ERROR_FETCHING_PLOT_CONFIG);
  });

  it('Invalid response format show an error notification', async () => {
    fetchMock.mockResponse(() => Promise.resolve(new Response('a text body')));

    await act(async () => {
      await testStore.dispatch(loadPlotConfig(experimentId, plotUuid, plotType));
    });

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith('error', expect.anything());
  });

  it('Hook modifies the returned config', async () => {
    // Test for config returned from the API
    fetchMock.mockResponse(() => Promise.resolve(new Response(JSON.stringify(mockConfigData))));

    const mockBeforeHook = (config) => {
      const newConfig = _.merge(config, { testNewConfig: 'returnedConfig' });

      return newConfig;
    };

    await act(async () => {
      await testStore.dispatch(loadPlotConfig(experimentId, plotUuid, plotType, mockBeforeHook));
    });

    // Hits the correct url
    const fetchUrl = fetchMock.mock.calls[0][0];
    expect(fetchUrl).toEqual(`http://localhost:3000/v2/experiments/${experimentId}/plots/${plotUuid}`);

    // Expect componentConfig to contain key for plotUuid
    expect(testStore.getState().componentConfig[plotUuid]).toBeDefined();
    const plotConfig = testStore.getState().componentConfig[plotUuid];

    // Check that the inserted key is defined

    expect(plotConfig.config.testNewConfig).toEqual('returnedConfig');
    expect(plotConfig).toMatchSnapshot();
  });

  it('Hook modifies initial config if fetch returns returned 404', async () => {
    fetchMock.mockResponse(() => Promise.resolve({ status: 404, body: JSON.stringify('Plot config not found') }));

    const mockBeforeHook = (config) => {
      const newConfig = _.merge(config, { testNewConfig: '404config' });

      return newConfig;
    };

    await act(async () => {
      await testStore.dispatch(loadPlotConfig(experimentId, plotUuid, plotType, mockBeforeHook));
    });

    // Hits the correct url
    const fetchUrl = fetchMock.mock.calls[0][0];
    expect(fetchUrl).toEqual(`http://localhost:3000/v2/experiments/${experimentId}/plots/${plotUuid}`);

    // Expect componentConfig to contain key for plotUuid
    expect(testStore.getState().componentConfig[plotUuid]).toBeDefined();
    const plotConfig = testStore.getState().componentConfig[plotUuid];

    // Check that the inserted key is defined

    expect(plotConfig.config.testNewConfig).toEqual('404config');
    expect(plotConfig).toMatchSnapshot();
  });
});
