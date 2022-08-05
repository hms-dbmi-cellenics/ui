import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import getTrajectoryGraph from 'components/plots/helpers/trajectory-analysis/getTrajectoryGraph';
import { fetchWork } from 'utils/work/fetchWork';
import handleError from 'utils/http/handleError';

import { PLOT_DATA_ERROR, PLOT_DATA_LOADED, PLOT_DATA_LOADING } from 'redux/actionTypes/componentConfig';

import mockTrajectoryGraph from '__test__/data/trajectory_graph.json';
import { initialEmbeddingState } from 'redux/reducers/embeddings/initialState';
import initialExperimentSettingsState from 'redux/reducers/experimentSettings/initialState';

jest.mock('utils/work/fetchWork', () => ({
  fetchWork: jest.fn(() => ({ data: {} })),
}));

jest.mock('utils/http/handleError');

jest.mock('utils/getTimeoutForWorkerTask', () => () => 60);

const mockStore = configureStore([thunk]);
const plotUuid = 'trajectoryAnalysisMock';

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
};

let store;

describe('Get trajectory graph', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    fetchWork.mockImplementation(() => ({
      data: mockTrajectoryGraph,
    }));

    store = mockStore(initialState);
  });

  it('Dispatches the correct events', async () => {
    await store.dispatch(getTrajectoryGraph(experimentId, plotUuid));

    const actions = store.getActions();
    expect(actions.length).toEqual(2);
    expect(actions[0].type).toEqual(PLOT_DATA_LOADING);
    expect(actions[1].type).toEqual(PLOT_DATA_LOADED);
    expect(actions[1]).toMatchSnapshot();
  });

  it('Dispatches error if there are errors when fetching work', async () => {
    fetchWork.mockImplementationOnce(() => new Promise((resolve, reject) => reject(new Error('random error!'))));

    await store.dispatch(getTrajectoryGraph(experimentId, plotUuid));

    const actions = store.getActions();
    expect(actions.length).toEqual(2);
    expect(actions[0].type).toBe(PLOT_DATA_LOADING);
    expect(actions[1].type).toBe(PLOT_DATA_ERROR);

    expect(handleError).toHaveBeenCalledTimes(1);
  });
});