import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

// eslint-disable-next-line import/no-named-as-default
import loadHeatmapGeneExpression from 'redux/actions/genes/loadHeatmapGeneExpression';
import {
  HEATMAP_GENES_EXPRESSION_LOADING,
  HEATMAP_GENES_EXPRESSION_LOADED,
} from 'redux/actionTypes/genes';
import fetchWork from 'utils/work/fetchWork';

import { getTwoGenesExpressionMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

jest.mock('utils/work/fetchWork');
jest.mock('utils/work/getHeatmapCellOrder', () => jest.fn(() => [0, 1, 2, 3, 4]));

describe('loadHeatmapGeneExpression Redux action - expression matrix data check', () => {
  let store;

  const mockExpressionMatrix = getTwoGenesExpressionMatrix();

  beforeEach(() => {
    jest.clearAllMocks();
    fetchWork.mockReset();
  });

  it('does not make a work request when all genes are already loaded in the matrix', async () => {
    // This validates the key optimization: if genes are already in the expression
    // matrix, no work request is made regardless of plots/tables
    store = mockStore({
      experimentSettings: {
        info: { experimentId: 'exp123' },
      },
      genes: {
        expression: {
          full: {
            matrix: mockExpressionMatrix, // Already has 'Gzma' and 'Lyz2'
            loading: [],
          },
          views: {
            testComponent: {
              data: [],
              fetching: false,
            },
          },
        },
      },
      componentConfig: {
        testComponent: {
          config: {
            selectedCellSet: 'louvain',
            groupedTracks: ['louvain'],
            selectedPoints: 'All',
          },
        },
      },
      cellSets: {
        hidden: new Set(),
      },
    });

    await store.dispatch(loadHeatmapGeneExpression(
      'exp123',
      ['Gzma', 'Lyz2'], // Both already in matrix
      'testComponent',
    ));

    // Key testing point: verify NO work request is made
    expect(fetchWork).not.toHaveBeenCalled();
    const dispatchedActions = store.getActions();
    // When all genes are already loaded, only LOADED action is dispatched (no LOADING)
    expect(dispatchedActions).toHaveLength(1);
    expect(dispatchedActions[0].type).toBe(HEATMAP_GENES_EXPRESSION_LOADED);
  });

  it('dispatches LOADING before attempting to fetch genes', async () => {
    store = mockStore({
      experimentSettings: {
        info: { experimentId: 'exp123' },
      },
      genes: {
        expression: {
          full: {
            matrix: getTwoGenesExpressionMatrix(),
            loading: [],
          },
          views: {
            testComponent: {
              data: [],
              fetching: false,
            },
          },
        },
      },
      componentConfig: {
        testComponent: {
          config: {
            selectedCellSet: 'louvain',
            groupedTracks: ['louvain'],
            selectedPoints: 'All',
          },
        },
      },
      cellSets: {
        hidden: new Set(),
        properties: {},
      },
    });

    fetchWork.mockResolvedValue({
      orderedGeneNames: ['NewGene'],
      rawExpression: { values: [], index: [], ptr: [] },
      stats: {
        rawMean: [], rawStdev: [], truncatedMin: [], truncatedMax: [],
      },
    });

    await store.dispatch(loadHeatmapGeneExpression(
      'exp123',
      ['NewGene'],
      'testComponent',
    ));

    const dispatchedActions = store.getActions();
    // First action should be LOADING to indicate fetching started
    expect(dispatchedActions[0].type).toBe(HEATMAP_GENES_EXPRESSION_LOADING);
    expect(dispatchedActions[0].payload.genes).toEqual(['NewGene']);
  });

  it('clears selectedGenes when genes array is empty', async () => {
    store = mockStore({
      experimentSettings: {
        info: { experimentId: 'exp123' },
      },
      genes: {
        expression: {
          full: {
            matrix: mockExpressionMatrix,
            loading: [],
          },
        },
      },
      componentConfig: {
        testComponent: {
          config: {},
        },
      },
    });

    await store.dispatch(loadHeatmapGeneExpression(
      'exp123',
      [],
      'testComponent',
    ));

    // When empty genes array is passed, only LOADED action is dispatched
    const dispatchedActions = store.getActions();
    expect(dispatchedActions).toHaveLength(1);
    expect(dispatchedActions[0].type).toBe(HEATMAP_GENES_EXPRESSION_LOADED);
    expect(dispatchedActions[0].payload.genes).toEqual([]);
  });

  it('handles case-insensitive gene matching for checking if loaded', async () => {
    store = mockStore({
      experimentSettings: {
        info: { experimentId: 'exp123' },
      },
      genes: {
        expression: {
          full: {
            matrix: mockExpressionMatrix, // Has 'Gzma' and 'Lyz2'
            loading: [],
          },
          views: {
            testComponent: {
              data: [],
              fetching: false,
            },
          },
        },
      },
      componentConfig: {
        testComponent: {
          config: {
            selectedCellSet: 'louvain',
            groupedTracks: ['louvain'],
            selectedPoints: 'All',
          },
        },
      },
      cellSets: {
        hidden: new Set(),
      },
    });

    await store.dispatch(loadHeatmapGeneExpression(
      'exp123',
      ['gzma', 'lyz2'], // lowercase versions
      'testComponent',
    ));

    // Should recognize these as already loaded (case-insensitive)
    // and NOT make a work request
    expect(fetchWork).not.toHaveBeenCalled();

    const dispatchedActions = store.getActions();
    // When all genes are already loaded, only LOADED action is dispatched (no LOADING)
    expect(dispatchedActions).toHaveLength(1);
    expect(dispatchedActions[0].type).toBe(HEATMAP_GENES_EXPRESSION_LOADED);
  });

  it('verifies that matrix data availability is checked before making requests', async () => {
    // This test validates the core optimization: checking expression matrix
    // has actual data (not just geneIndexes) before deciding to fetch
    const sparseGeneMatrix = getTwoGenesExpressionMatrix();

    // Verify matrix has genes loaded before test
    expect(sparseGeneMatrix.genesAreLoaded(['Gzma', 'Lyz2'])).toBe(true);

    store = mockStore({
      experimentSettings: {
        info: { experimentId: 'exp123' },
      },
      genes: {
        expression: {
          full: {
            matrix: sparseGeneMatrix,
            loading: [],
          },
          views: {
            testComponent: {
              data: [],
              fetching: false,
            },
          },
        },
      },
      componentConfig: {
        testComponent: {
          config: {
            selectedCellSet: 'louvain',
            groupedTracks: ['louvain'],
            selectedPoints: 'All',
          },
        },
      },
      cellSets: {
        hidden: new Set(),
      },
    });

    await store.dispatch(loadHeatmapGeneExpression(
      'exp123',
      ['Gzma', 'Lyz2'],
      'testComponent',
    ));

    // Verify NO work request made for established genes
    expect(fetchWork).not.toHaveBeenCalled();
  });
});
