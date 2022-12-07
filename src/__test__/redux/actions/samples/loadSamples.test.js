import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import initialSampleState from 'redux/reducers/samples/initialState';
import { SAMPLES_ERROR, SAMPLES_LOADED, SAMPLES_LOADING } from 'redux/actionTypes/samples';
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

  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValue(response);
  });

  it('Works correctly', async () => {
    // mock new response from apiv2
    const responseV2 = new Response(
      JSON.stringify(
        [{
          id: 'e03ef6ea-5014-4e57-aecd-59964ac9172c',
          experimentId: 'fd8d5f24-a2d9-da28-2ffd-725b99b1127b',
          name: 'BLp7',
          sampleTechnology: '10x',
          createdAt: '2021-12-07 17:36:27.773+00',
          updatedAt: '2021-12-07 17:38:42.036+00',
          metadata: { age: 'BL', timePoint: 'BL' },
          files: {
            matrix10X: { uploadStatus: 'uploaded', sampleFileType: 'matrix10x' },
            barcodes10X: { uploadStatus: 'uploaded', sampleFileType: 'barcodes10x' },
            features10X: { uploadStatus: 'uploaded', sampleFileType: 'features10x' },
          },
          options: {},
        }],

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

  it('Dispatches error correctly', async () => {
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockRejectOnce(new Error('An api error'));

    const store = mockStore(initialState);
    await store.dispatch(loadSamples(experimentId));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([SAMPLES_LOADING, SAMPLES_ERROR]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });
});
