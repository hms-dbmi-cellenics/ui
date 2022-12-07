import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import getTrajectoryPlotStartingNodes from 'redux/actions/componentConfig/getTrajectoryPlotStartingNodes';
import fetchWork from 'utils/work/fetchWork';
import handleError from 'utils/http/handleError';

import { PLOT_DATA_ERROR, PLOT_DATA_LOADED, PLOT_DATA_LOADING } from 'redux/actionTypes/componentConfig';

import mockStartingNodes from '__test__/data/starting_nodes.json';
import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import initialExperimentSettingsState from 'redux/reducers/experimentSettings/initialState';

jest.mock('utils/http/handleError');
jest.mock('utils/work/fetchWork', () => jest.fn(() => ({})));
jest.mock('utils/getTimeoutForWorkerTask', () => () => 60);

const mockStore = configureStore([thunk]);
const plotUuid = 'trajectoryAnalysisMock';

const startDate = '2021-01-01T00:00:00';
const experimentId = '1234';

const initialState = {
  experimentSettings: {
    ...initialExperimentSettingsState,
    processing: {
      ...initialExperimentSettingsState.processing,
      configureEmbedding: {
        embeddingSettings: {
          method: 'umap',
          methodSettings: {
            tsne: {
              perplexity: 30,
              learningRate: 336.1667,
            },
            umap: {
              distanceMetric: 'cosine',
              minimumDistance: 0.3,
            },
          },
        },
        clusteringSettings: {
          method: 'louvain',
          methodSettings: {
            louvain: {
              resolution: 0.8,
            },
          },
        },
      },
    },
  },
  embeddings: {
    umap: initialEmbeddingState,
    Etag: 'mockEtag',
  },
  componentConfig: {
    [plotUuid]: {},
  },
  backendStatus: { [experimentId]: { status: { pipeline: { startDate } } } },
  networkResources: {
    environment: 'testing',
  },
};

let store;

describe('Get trajectory plot starting nodes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchWork.mockImplementation(() => (mockStartingNodes));

    store = mockStore(initialState);
  });

  it('Dispatches the correct events', async () => {
    await store.dispatch(getTrajectoryPlotStartingNodes(experimentId, plotUuid));

    const actions = store.getActions();
    expect(actions.length).toEqual(2);
    expect(actions[0].type).toEqual(PLOT_DATA_LOADING);
    expect(actions[1].type).toEqual(PLOT_DATA_LOADED);
    expect(actions[1]).toMatchSnapshot();
  });

  it('Dispatches error if there are errors when fetching work', async () => {
    fetchWork.mockImplementationOnce(() => new Promise((resolve, reject) => reject(new Error('random error!'))));

    await store.dispatch(getTrajectoryPlotStartingNodes(experimentId, plotUuid));

    const actions = store.getActions();
    expect(actions.length).toEqual(2);
    expect(actions[0].type).toBe(PLOT_DATA_LOADING);
    expect(actions[1].type).toBe(PLOT_DATA_ERROR);

    expect(handleError).toHaveBeenCalledTimes(1);
  });
});
