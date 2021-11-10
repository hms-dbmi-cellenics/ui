import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { act } from 'react-dom/test-utils';

import { makeStore } from 'redux/store';

import plotNames from 'utils/plots/plotNames';
import fake from '__test__/test-utils/constants';

import { fetchPlotDataWork, loadPlotConfig } from 'redux/actions/componentConfig';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { fetchWork } from 'utils/work/fetchWork';

enableFetchMocks();

// Return 404 to use default plot config
fetchMock.mockResponse(() => ({
  status: 404,
  body: 'Not Found',
}));

jest.mock('utils/pushNotificationMessage');
jest.mock('utils/work/generatePlotWorkBody');
jest.mock('utils/work/fetchWork', () => ({
  fetchWork: jest.fn(() => Promise.resolve(
    ['work-result-1', 'work-result-2'],
  )),
}));

const experimentId = fake.EXPERIMENT_ID;
let storeState = null;

const plotUuid = 'DotPlotMain';
const plotType = plotNames.plotType.DOT_PLOT;

describe('plotDataLoaded', () => {
  beforeEach(() => {
    storeState = makeStore();

    storeState.dispatch(loadPlotConfig(plotUuid, plotType));
  });

  it('Loads plot data into the component properly', async () => {
    await act((async () => {
      await storeState.dispatch(fetchPlotDataWork(experimentId, plotUuid, plotType));
    }));

    const { plotData } = storeState.getState().componentConfig[plotUuid];

    expect(plotData.length).toBeGreaterThan(0);
  });

  it('Throws an error if there is an error fetching plot data', async () => {
    fetchWork.mockImplementation(() => {
      throw new Error('Error fetching work');
    });

    await act((async () => {
      await storeState.dispatch(fetchPlotDataWork(experimentId, plotUuid, plotType));
    }));

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
  });

  it('Sets up a loading state when waiting for components', () => {

  });

  it('Resolves the loading state if data is successfully loaded', () => {

  });

  it('Resolves the loading state if an error occurs', () => {

  });
});
