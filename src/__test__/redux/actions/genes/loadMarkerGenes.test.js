import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchWork from 'utils/work/fetchWork';
import loadMarkerGenes from 'redux/actions/genes/loadMarkerGenes';
import { MARKER_GENES_ERROR, MARKER_GENES_LOADED, MARKER_GENES_LOADING } from 'redux/actionTypes/genes';
import getInitialState from 'redux/reducers/genes/getInitialState';

import '__test__/test-utils/setupTests';
import { getOneGeneMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';

jest.mock('utils/work/fetchWork');

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

const mockStore = configureStore([thunk]);

describe('loadMarkerGenes action', () => {
  const experimentId = '1234';

  const backendStatus = {
    [experimentId]: {
      status: {
        pipeline: {
          status: 'SUCCEEDED',
          startDate: '2021-01-01T01:01:01.000Z',
        },
      },
    },
  };

  const experimentSettings = {
    processing: {
      configureEmbedding: {
        clusteringSettings: {
          method: 'methodId',
        },
      },
    },
  };

  it('dispatches appropriately on success', async () => {
    const store = mockStore({
      genes: {
        ...getInitialState(),
        markers: {
          ...getInitialState().markers,
          ETag: 'new-etag',
        },
      },
      experimentSettings,
      backendStatus,
    });

    const mockResult = {
      ...getOneGeneMatrix('geneA', 1),
      cellOrder: [0],
    };

    fetchWork.mockImplementationOnce((_expId, _body, _getState, _dispatch, optionals) => {
      // Simulate etag being generated
      optionals.onETagGenerated('new-etag');

      return new Promise((resolve) => resolve(mockResult));
    });

    await store.dispatch(loadMarkerGenes(experimentId, 'interactiveHeatmap'));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([MARKER_GENES_LOADING, MARKER_GENES_LOADED]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });

  it('dispatches appropriately on error', async () => {
    const store = mockStore({
      genes: getInitialState(),
      experimentSettings,
      backendStatus,
    });

    fetchWork.mockImplementationOnce((_expId, _body, _getState, _dispatch, optionals) => {
      // Simulate etag being generated
      optionals.onETagGenerated('new-etag');

      return new Promise((_resolve, reject) => reject(new Error('random error!')));
    });

    await store.dispatch(loadMarkerGenes(experimentId, 'interactiveHeatmap'));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([MARKER_GENES_LOADING, MARKER_GENES_ERROR]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });

  it('Defaults to louvain cluster if selected cell set is not provided', async () => {
    const store = mockStore({
      genes: getInitialState(),
      experimentSettings,
      backendStatus,
    });

    const workRequestBody = {
      name: 'MarkerHeatmap',
      nGenes: 5,
      cellSetKey: 'louvain',
      groupByClasses: ['louvain'],
      hiddenCellSetKeys: [],
      selectedPoints: 'All',
    };

    await store.dispatch(loadMarkerGenes(experimentId, 'interactiveHearmap', { numGenes: 5 }));

    expect(fetchWork).toHaveBeenCalled();

    const functionArgs = fetchWork.mock.calls[0];

    expect(functionArgs[1]).toEqual(workRequestBody);
  });

  it('Doesnt dispatch MARKER_GENES_LOADED if theres a different ETag stored', async () => {
    const store = mockStore({
      genes: {
        ...getInitialState(),
        markers: {
          ...getInitialState().markers,
          ETag: 'different-etag',
        },
      },
      experimentSettings,
      backendStatus,
    });

    const mockResult = {
      ...getOneGeneMatrix('geneA', 1),
      cellOrder: [0],
    };

    fetchWork.mockImplementationOnce((_expId, _body, _getState, _dispatch, optionals) => {
      // Simulate etag being generated
      optionals.onETagGenerated('new-etag');

      return new Promise((resolve) => resolve(mockResult));
    });

    await store.dispatch(loadMarkerGenes(experimentId, 'interactiveHeatmap'));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([MARKER_GENES_LOADING]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();
  });
});
