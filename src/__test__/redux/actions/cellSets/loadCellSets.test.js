import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import loadCellSets from 'redux/actions/cellSets/loadCellSets';
import initialState from 'redux/reducers/cellSets/initialState';

import '__test__/test-utils/setupTests';
import { CELL_SETS_ERROR, CELL_SETS_LOADED, CELL_SETS_LOADING } from 'redux/actionTypes/cellSets';

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('loadCellSets action', () => {
  const experimentId = '1234';

  const cellSets = [
    {
      key: 'louvain',
      name: 'louvain clusters',
      rootNode: true,
      type: 'cellSets',
      children: [
        {
          key: 'louvain-1',
          name: 'Cluster 1',
          rootNode: false,
          type: 'cellSets',
          color: '#ee8866',
          cellIds: [5, 18, 33, 55, 77],
        },
        {
          key: 'louvain-0',
          name: 'Cluster 0',
          rootNode: false,
          type: 'cellSets',
          color: '#000000',
          cellIds: [11, 23, 27, 48, 61],
        },
        {
          key: 'louvain-3',
          name: 'Cluster 3',
          rootNode: false,
          type: 'cellSets',
          color: '#ffaabb',
          cellIds: [68, 112, 122, 132, 189],
        },
        {
          key: 'louvain-2',
          name: 'Cluster 2',
          rootNode: false,
          type: 'cellSets',
          color: '#eedd88',
          cellIds: [3, 34, 42, 49, 71],
        },
      ],
    },
    {
      key: 'scratchpad',
      name: 'Custom cell sets',
      rootNode: true,
      children: [
        {
          key: '8297d513-6268-4ab0-a03e-e74a23ecec07',
          name: 'New Cluster',
          color: '#3957ff',
          type: 'cellSets',
          cellIds: [3103, 449, 4023, 2545, 930],
        },
        {
          key: '99a7746b-7f9d-4e54-8acf-53031e4ff023',
          name: 'New Cluster2',
          color: '#d3fe14',
          type: 'cellSets',
          cellIds: [6536, 3654, 1075, 1538, 193],
        },
      ],
      type: 'cellSets',
    },
    {
      key: 'sample',
      name: 'Samples',
      rootNode: true,
      children: [
        {
          key: 'b15fa0d6-74e8-49da-bcbb-aa07127960d0',
          name: 'Convalescent',
          color: '#77aadd',
          cellIds: [0, 1, 2, 4, 5, 7],
        },
      ],
      type: 'metadataCategorical',
    },
  ];

  const experimentSettings = {
    info: {
      sampleIds: [],
    },
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({ cellSets }));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on normal operation', async () => {
    const store = mockStore({
      cellSets: {
        initialLoadPending: false, loading: false, error: false, updatingClustering: false,
      },
      experimentSettings,
    });

    await store.dispatch(loadCellSets(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches on force reload', async () => {
    const store = mockStore({ cellSets: { loading: false, error: false }, experimentSettings });
    await store.dispatch(loadCellSets(experimentId, true));

    expect(_.map(store.getActions(), 'type')).toEqual([CELL_SETS_LOADING, CELL_SETS_LOADED]);
  });

  it('Dispatches on initial load pending false and error state', async () => {
    const store = mockStore({
      cellSets: { initialLoadPending: false, loading: false, error: true },
      experimentSettings,
    });

    await store.dispatch(loadCellSets(experimentId));

    expect(_.map(store.getActions(), 'type')).toEqual([CELL_SETS_LOADING, CELL_SETS_LOADED]);
    expect(store.getActions()).toMatchSnapshot();
  });

  it('Dispatches a loaded action when run with the initial state.', async () => {
    const store = mockStore({ cellSets: initialState, experimentSettings });
    await store.dispatch(loadCellSets(experimentId));

    expect(_.map(store.getActions(), 'type')).toEqual([CELL_SETS_LOADING, CELL_SETS_LOADED]);

    expect(store.getActions()).toMatchSnapshot();
  });

  it('Dispatches an error condition if fetch fails', async () => {
    const store = mockStore({ cellSets: initialState, experimentSettings });

    fetchMock.resetMocks();
    fetchMock.mockReject(new Error('some weird error that happened'));

    await store.dispatch(loadCellSets(experimentId));

    expect(_.map(store.getActions(), 'type')).toEqual([CELL_SETS_LOADING, CELL_SETS_ERROR]);
    expect(store.getActions()).toMatchSnapshot();
  });

  it('Uses V2 URL when using API version V2', async () => {
    const store = mockStore({ cellSets: initialState, experimentSettings });
    await store.dispatch(loadCellSets(experimentId));

    const fetchUrl = fetchMock.mock.calls[0][0];

    expect(fetchUrl).toEqual('http://localhost:3000/v2/experiments/1234/cellSets');
  });
});
