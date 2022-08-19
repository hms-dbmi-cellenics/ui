import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { act } from 'react-dom/test-utils';

import { makeStore } from 'redux/store';

import { plotTypes } from 'utils/constants';
import fake from '__test__/test-utils/constants';

import { fetchDotPlotData } from 'redux/actions/componentConfig';
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
let testStore = null;

const plotUuid = 'DotPlotMain';
const plotType = plotTypes.DOT_PLOT;

describe('fetchDotPlotData', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fetchMock.resetMocks();

    fetchMock.mockResponse(() => Promise.resolve({ status: 404, body: JSON.stringify('Plot config not found') }));

    testStore = makeStore();
  });

  it('Loads plot data into the component properly', async () => {
    await act((async () => {
      await testStore.dispatch(fetchDotPlotData(experimentId, plotUuid, plotType));
    }));

    const { plotData } = testStore.getState().componentConfig[plotUuid];

    // In the end, loading state should be resolved to false after data is loaded
    expect(testStore.getState().componentConfig[plotUuid].loading).toEqual(false);
    expect(testStore.getState().componentConfig[plotUuid].error).toEqual(false);

    expect(plotData.length).toBeGreaterThan(0);
  });

  it('Displays notification if there is an error fetching plot data', async () => {
    fetchWork.mockImplementation(() => {
      throw new Error('Error fetching work');
    });

    await act((async () => {
      await testStore.dispatch(fetchDotPlotData(experimentId, plotUuid, plotType));
    }));

    // The test store error should not be false and loading should be resolved
    expect(testStore.getState().componentConfig[plotUuid].error).toBeTruthy();
    expect(testStore.getState().componentConfig[plotUuid].loading).toEqual(false);

    expect(pushNotificationMessage).toHaveBeenCalledTimes(1);
    expect(pushNotificationMessage).toHaveBeenCalledWith('error', expect.anything());
  });
});
