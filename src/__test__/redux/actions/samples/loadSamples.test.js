import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import initialSampleState from 'redux/reducers/samples/initialState';
import { SAMPLES_ERROR, SAMPLES_LOADED } from 'redux/actionTypes/samples';
import { loadSamples } from 'redux/actions/samples';

enableFetchMocks();

const mockStore = configureStore([thunk]);

describe('loadSample action', () => {
  const experimentId = '1234';

  const initialState = {
    samples: {
      ...initialSampleState,
    },
  };

  const response = new Response(
    JSON.stringify(
      [
        {
          samples: {
            ids: ['sample-1', 'sample-2'],
            'sample-1': { name: 'sample-1' },
            'sample-2': { name: 'sample-2' },
          },
        }],
    ),
  );

  fetchMock.resetMocks();
  fetchMock.doMock();
  fetchMock.mockResolvedValue(response);

  it('Dispatches event correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(loadSamples(experimentId));

    // LOAD SAMPLE
    const action1 = store.getActions()[1];
    expect(action1.type).toEqual(SAMPLES_LOADED);
  });

  it('Dispatches error correctly', async () => {
    fetchMock.mockReject(new Error('Failed fetching samples'));

    const store = mockStore(initialState);
    await store.dispatch(loadSamples(experimentId));

    // LOAD SAMPLE
    const action1 = store.getActions()[1];
    expect(action1.type).toEqual(SAMPLES_ERROR);
  });
});
