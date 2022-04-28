import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import initialSampleState from 'redux/reducers/samples/initialState';
import { SAMPLES_ERROR, SAMPLES_LOADED } from 'redux/actionTypes/samples';
import { loadSamples } from 'redux/actions/samples';
import config from 'config';
import { api } from 'utils/constants';

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

  it('works with apiv2', async () => {
    config.currentApiVersion = api.V2;
    // mock new response from apiv2
    const responseV2 = new Response(
      JSON.stringify(
        {
          data: {
            message: [{
              id: 'e03ef6ea-5014-4e57-aecd-59964ac9172c',
              experimentId: 'fd8d5f24-a2d9-da28-2ffd-725b99b1127b',
              name: 'BLp7',
              sampleTechnology: '10x',
              createdAt: '2021-12-07 17:36:27.773+00',
              updatedAt: '2021-12-07 17:38:42.036+00',
              metadata: { age: 'BL', timePoint: 'BL' },
              files: {
                matrix10X: { uploadStatus: 'uploaded', s3Path: 'someidhere/anotherpath/matrix.tsv.gz' },
                barcodes10X: { uploadStatus: 'uploaded', s3Path: 'someidhere/anotherpath/barcodes.tsv.gz' },
                features10X: { uploadStatus: 'uploaded', s3Path: 'someidhere/anotherpath/features.tsv.gz' },
              },
            }],
          },
        },
      ),
    );
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValue(responseV2);

    const store = mockStore(initialState);
    await store.dispatch(loadSamples(experimentId));

    const action1 = store.getActions()[1];
    expect(action1.type).toEqual(SAMPLES_LOADED);
    expect(action1.payload).toMatchSnapshot();
  });
});
