import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { SparseMatrix } from 'mathjs';

import loadHeatmapExpression, { LARGE_DATASET_THRESHOLD } from 'redux/actions/genes/loadHeatmapExpression';
import getInitialState from 'redux/reducers/genes/getInitialState';

import {
  HEATMAP_EXPRESSION_LOADING,
  HEATMAP_EXPRESSION_LOADED,
  HEATMAP_EXPRESSION_ERROR,
} from 'redux/actionTypes/genes';

import fetchWork from 'utils/work/fetchWork';

jest.mock('utils/work/fetchWork');

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true,
  default: () => 60,
}));

jest.mock('redux/actions/genes/loadGeneExpression', () => jest.fn(
  () => ({ type: 'GENES_EXPRESSION_LOADING' }),
));

// Partial mock so we can spy on getBuckets and control the default export
jest.mock('utils/work/getHeatmapCellOrder', () => {
  const actual = jest.requireActual('utils/work/getHeatmapCellOrder');
  return {
    __esModule: true,
    ...actual,
    getBuckets: jest.fn(actual.getBuckets),
    default: jest.fn(actual.default),
  };
});

const { getBuckets } = require('utils/work/getHeatmapCellOrder');
const getHeatmapCellOrder = require('utils/work/getHeatmapCellOrder').default;
const loadGeneExpression = require('redux/actions/genes/loadGeneExpression');

const mockStore = configureStore([thunk]);

// ─── shared mock data ────────────────────────────────────────────────────────

const experimentId = 'test-experiment-1';

// Small dataset cell sets (total cells: 3, below threshold)
const smallCellSets = {
  hierarchy: [
    { key: 'louvain', children: [{ key: 'louvain-0' }] },
    { key: 'sample', children: [{ key: 'sample-1' }] },
  ],
  properties: {
    'louvain-0': { cellIds: new Set([0, 1, 2]) },
    'sample-1': { cellIds: { size: 3 } }, // only .size is used by getTotalCells
  },
  loading: false,
  initialLoadPending: false,
  updatingClustering: false,
  error: false,
  hidden: new Set(),
  selected: [],
};

// Large dataset cell sets (total cells: >= LARGE_DATASET_THRESHOLD)
const LARGE_CELL_COUNT = LARGE_DATASET_THRESHOLD + 1;
const largeCellSets = {
  hierarchy: [
    { key: 'louvain', children: [{ key: 'louvain-0' }] },
    { key: 'sample', children: [{ key: 'sample-1' }] },
  ],
  properties: {
    'louvain-0': { cellIds: { size: LARGE_CELL_COUNT, has: () => true, forEach: () => {} } },
    'sample-1': { cellIds: { size: LARGE_CELL_COUNT } },
  },
  loading: false,
  initialLoadPending: false,
  updatingClustering: false,
  error: false,
  hidden: new Set(),
  selected: [],
};

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

const makeWorkerResponse = (overrides = {}) => ({
  orderedGeneNames: ['GENE1'],
  rawExpression: {
    mathjs: 'SparseMatrix', index: [], ptr: [0, 0], size: [3, 1], values: [],
  },
  stats: {
    rawMean: [0], rawStdev: [0], truncatedMin: [0], truncatedMax: [0],
  },
  cellIds: [0, 1, 2],
  ...overrides,
});

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeState = (cellSets, genesOverrides = {}) => {
  const genesInitial = getInitialState();
  return {
    genes: {
      ...genesInitial,
      expression: {
        ...genesInitial.expression,
        ...genesOverrides,
      },
    },
    cellSets,
    backendStatus,
  };
};

// ─── tests ───────────────────────────────────────────────────────────────────

describe('loadHeatmapExpression', () => {
  const options = {
    selectedCellSet: 'louvain',
    groupedTracks: ['sample'],
    hiddenCellSets: [],
    plotUuid: 'test-plot-uuid',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    loadGeneExpression.mockImplementation(() => ({ type: 'GENES_EXPRESSION_LOADING' }));
  });

  it('returns null and dispatches nothing for empty genes array', async () => {
    const store = mockStore(makeState(smallCellSets));
    const result = await store.dispatch(loadHeatmapExpression(experimentId, [], options));
    expect(result).toBeNull();
    expect(store.getActions()).toHaveLength(0);
  });

  it('returns null and dispatches nothing when cellSets are not accessible', async () => {
    const inaccessibleCellSets = {
      ...smallCellSets,
      loading: true, // causes accessible=false
    };
    const store = mockStore(makeState(inaccessibleCellSets));
    const result = await store.dispatch(
      loadHeatmapExpression(experimentId, ['GENE1'], options),
    );
    expect(result).toBeNull();
    expect(store.getActions()).toHaveLength(0);
  });

  it('delegates to loadGeneExpression for small datasets', async () => {
    const store = mockStore(makeState(smallCellSets));
    await store.dispatch(loadHeatmapExpression(experimentId, ['GENE1'], options));
    expect(loadGeneExpression).toHaveBeenCalledWith(experimentId, ['GENE1'], options.plotUuid);
    // loadGeneExpression mock returns a plain action object (not a thunk), so it gets dispatched
    const actions = store.getActions();
    expect(actions.some((a) => a.type === 'GENES_EXPRESSION_LOADING')).toBe(true);
  });

  it('returns null and dispatches nothing if downsampled is already loading', async () => {
    const state = makeState(largeCellSets, {
      downsampled: { loading: true },
    });
    getBuckets.mockReturnValueOnce({
      buckets: [new Set([0, 1])],
      totalSize: 2,
    });
    const store = mockStore(state);
    const result = await store.dispatch(
      loadHeatmapExpression(experimentId, ['GENE1'], options),
    );
    expect(result).toBeNull();
    expect(store.getActions()).toHaveLength(0);
  });

  it('dispatches LOADING and LOADED for large dataset (bucketed path)', async () => {
    // Bucketed: cappedTotal < LARGE_DATASET_THRESHOLD
    // Two small buckets → cappedTotal = 2 < 50000
    getBuckets.mockReturnValueOnce({
      buckets: [new Set([0]), new Set([1])],
      totalSize: 2,
    });
    fetchWork.mockResolvedValueOnce(makeWorkerResponse());

    const store = mockStore(makeState(largeCellSets));
    await store.dispatch(loadHeatmapExpression(experimentId, ['GENE1'], options));

    const types = store.getActions().map((a) => a.type);
    expect(types).toContain(HEATMAP_EXPRESSION_LOADING);
    expect(types).toContain(HEATMAP_EXPRESSION_LOADED);
  });

  it('sends bucketed downsampleSettings (selectedCellSet + groupedTracks) for bucketed path', async () => {
    getBuckets.mockReturnValueOnce({
      buckets: [new Set([0]), new Set([1])],
      totalSize: 2,
    });
    fetchWork.mockResolvedValueOnce(makeWorkerResponse());

    const store = mockStore(makeState(largeCellSets));
    await store.dispatch(loadHeatmapExpression(experimentId, ['GENE1'], options));

    const [, body] = fetchWork.mock.calls[0];
    expect(body.downsampleSettings).toMatchObject({
      selectedCellSet: options.selectedCellSet,
      groupedTracks: options.groupedTracks,
    });
    expect(body.downsampleSettings.cellIds).toBeUndefined();
  });

  it('dispatches LOADING and LOADED for large dataset (precomputed path)', async () => {
    // Precomputed: cappedTotal = n_buckets * min(bucket.size, 1000) >= LARGE_DATASET_THRESHOLD
    // 60 buckets of size 1000 → cappedTotal = 60000 >= 50000
    getBuckets.mockReturnValueOnce({
      buckets: Array.from({ length: 60 }, () => ({ size: 1000, forEach: () => {} })),
      totalSize: 60000,
    });
    getHeatmapCellOrder.mockReturnValueOnce([0, 1, 2]);
    fetchWork.mockResolvedValueOnce(makeWorkerResponse({ cellIds: [0, 1, 2] }));

    const store = mockStore(makeState(largeCellSets));
    await store.dispatch(loadHeatmapExpression(experimentId, ['GENE1'], options));

    const types = store.getActions().map((a) => a.type);
    expect(types).toContain(HEATMAP_EXPRESSION_LOADING);
    expect(types).toContain(HEATMAP_EXPRESSION_LOADED);
  });

  it('sends cellIds in downsampleSettings for precomputed path', async () => {
    getBuckets.mockReturnValueOnce({
      buckets: Array.from({ length: 60 }, () => ({ size: 1000, forEach: () => {} })),
      totalSize: 60000,
    });
    const precomputedCellIds = [10, 11, 12];
    getHeatmapCellOrder.mockReturnValueOnce(precomputedCellIds);
    fetchWork.mockResolvedValueOnce(makeWorkerResponse({ cellIds: precomputedCellIds }));

    const store = mockStore(makeState(largeCellSets));
    await store.dispatch(loadHeatmapExpression(experimentId, ['GENE1'], options));

    const [, body] = fetchWork.mock.calls[0];
    expect(Array.isArray(body.downsampleSettings.cellIds)).toBe(true);
    expect(body.downsampleSettings.selectedCellSet).toBeUndefined();
  });

  it('dispatches HEATMAP_EXPRESSION_ERROR on fetchWork failure', async () => {
    getBuckets.mockReturnValueOnce({
      buckets: [new Set([0])],
      totalSize: 1,
    });
    fetchWork.mockRejectedValueOnce(new Error('worker failure'));

    const store = mockStore(makeState(largeCellSets));
    await store.dispatch(loadHeatmapExpression(experimentId, ['GENE1'], options));

    const types = store.getActions().map((a) => a.type);
    expect(types).toContain(HEATMAP_EXPRESSION_LOADING);
    expect(types).toContain(HEATMAP_EXPRESSION_ERROR);
  });

  it('returns null without dispatching when all genes already loaded with unchanged settings', async () => {
    getBuckets.mockReturnValueOnce({
      buckets: [new Set([0])],
      totalSize: 1,
    });

    const genesInitial = getInitialState();
    // Pre-seed stored genes in the downsampled matrix
    genesInitial.expression.downsampled.matrix.setGeneExpression(
      ['GENE1'],
      new SparseMatrix([[0]]),
      {
        rawMean: [0], rawStdev: [0], truncatedMin: [0], truncatedMax: [0],
      },
    );
    genesInitial.expression.downsampled.lastFetchSettings = {
      downsampleType: 'bucketed',
      selectedCellSet: options.selectedCellSet,
      groupedTracks: options.groupedTracks,
      cellIdsKey: null,
    };
    genesInitial.expression.downsampled.downsampleType = 'bucketed';

    const store = mockStore(makeState(largeCellSets, {
      downsampled: genesInitial.expression.downsampled,
    }));

    const result = await store.dispatch(
      loadHeatmapExpression(experimentId, ['GENE1'], options),
    );

    expect(result).toBeNull();
    expect(store.getActions()).toHaveLength(0);
    expect(fetchWork).not.toHaveBeenCalled();
  });

  it('uses stored cellIds in append request (settings unchanged, new genes)', async () => {
    getBuckets.mockReturnValueOnce({
      buckets: [new Set([0])],
      totalSize: 1,
    });
    fetchWork.mockResolvedValueOnce(makeWorkerResponse({ orderedGeneNames: ['GENE2'] }));

    const storedCellIds = [0, 1, 2, 3];
    const genesInitial = getInitialState();
    // GENE1 already loaded
    genesInitial.expression.downsampled.matrix.setGeneExpression(
      ['GENE1'],
      new SparseMatrix([[0]]),
      {
        rawMean: [0], rawStdev: [0], truncatedMin: [0], truncatedMax: [0],
      },
    );
    genesInitial.expression.downsampled.lastFetchSettings = {
      downsampleType: 'bucketed',
      selectedCellSet: options.selectedCellSet,
      groupedTracks: options.groupedTracks,
      cellIdsKey: null,
    };
    genesInitial.expression.downsampled.downsampleType = 'bucketed';
    genesInitial.expression.downsampled.cellIds = storedCellIds;

    const store = mockStore(makeState(largeCellSets, {
      downsampled: genesInitial.expression.downsampled,
    }));

    // Request GENE1 + GENE2 - GENE1 is already loaded, GENE2 is new
    await store.dispatch(
      loadHeatmapExpression(experimentId, ['GENE1', 'GENE2'], options),
    );

    // Should use stored cellIds in the request (append mode)
    const [, body] = fetchWork.mock.calls[0];
    expect(body.downsampleSettings.cellIds).toEqual(storedCellIds);
    expect(body.genes).toEqual(['GENE2']); // only the new gene
  });
});
