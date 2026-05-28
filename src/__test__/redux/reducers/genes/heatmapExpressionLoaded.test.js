import { SparseMatrix } from 'mathjs';
import ExpressionMatrix from 'utils/ExpressionMatrix/ExpressionMatrix';
import heatmapExpressionLoaded from 'redux/reducers/genes/heatmapExpressionLoaded';

const makeMatrix = () => new ExpressionMatrix();

// Minimal valid gene data (1 gene, 3 cells) for setGeneExpression / pushGeneExpression
const makeGeneData = (geneName = 'GENE1') => ({
  orderedGeneNames: [geneName],
  rawExpression: new SparseMatrix([[0], [1], [2]]),
  stats: {
    rawMean: [1],
    rawStdev: [0.5],
    truncatedMin: [0],
    truncatedMax: [2],
  },
});

const makeAction = (overrides = {}) => ({
  payload: {
    newGenes: null,
    cellIds: [0, 1, 2],
    downsampleType: 'bucketed',
    lastFetchSettings: {
      downsampleType: 'bucketed',
      selectedCellSet: 'louvain',
      groupedTracks: ['sample'],
      cellIdsKey: null,
    },
    isAppend: false,
    genesAlreadyLoaded: [],
    ...overrides,
  },
});

describe('heatmapExpressionLoaded', () => {
  let baseState;

  beforeEach(() => {
    baseState = {
      expression: {
        full: { matrix: makeMatrix(), loading: [], error: false },
        downsampled: {
          loading: true,
          error: false,
          matrix: makeMatrix(),
          cellIds: null,
          downsampleType: null,
          lastFetchSettings: null,
        },
      },
    };
  });

  it('sets downsampled.loading to false', () => {
    const newState = heatmapExpressionLoaded(baseState, makeAction());
    expect(newState.expression.downsampled.loading).toBe(false);
  });

  it('clears downsampled.error', () => {
    baseState.expression.downsampled.error = new Error('previous error');
    const newState = heatmapExpressionLoaded(baseState, makeAction());
    expect(newState.expression.downsampled.error).toBe(false);
  });

  it('stores cellIds when not an append and newGenes is provided', () => {
    const action = makeAction({
      newGenes: makeGeneData('GENE1'),
      cellIds: [10, 20, 30],
      isAppend: false,
    });
    const newState = heatmapExpressionLoaded(baseState, action);
    expect(newState.expression.downsampled.cellIds).toEqual([10, 20, 30]);
  });

  it('stores downsampleType when not an append and newGenes is provided', () => {
    const action = makeAction({
      newGenes: makeGeneData('GENE1'),
      downsampleType: 'precomputed',
      isAppend: false,
    });
    const newState = heatmapExpressionLoaded(baseState, action);
    expect(newState.expression.downsampled.downsampleType).toBe('precomputed');
  });

  it('stores lastFetchSettings when not an append and newGenes is provided', () => {
    const settings = {
      downsampleType: 'bucketed',
      selectedCellSet: 'louvain',
      groupedTracks: ['sample'],
      cellIdsKey: null,
    };
    const action = makeAction({
      newGenes: makeGeneData('GENE1'),
      lastFetchSettings: settings,
      isAppend: false,
    });
    const newState = heatmapExpressionLoaded(baseState, action);
    expect(newState.expression.downsampled.lastFetchSettings).toEqual(settings);
  });

  it('does not overwrite cellIds/downsampleType/lastFetchSettings in append mode', () => {
    const existingCellIds = [1, 2, 3];
    baseState.expression.downsampled.cellIds = existingCellIds;
    baseState.expression.downsampled.downsampleType = 'bucketed';
    baseState.expression.downsampled.lastFetchSettings = { selectedCellSet: 'louvain' };

    const action = makeAction({
      newGenes: makeGeneData('GENE2'),
      cellIds: [99], // should NOT be used for append
      downsampleType: 'precomputed',
      lastFetchSettings: { selectedCellSet: 'sample' },
      isAppend: true,
    });
    const newState = heatmapExpressionLoaded(baseState, action);
    expect(newState.expression.downsampled.cellIds).toEqual(existingCellIds);
    expect(newState.expression.downsampled.downsampleType).toBe('bucketed');
    expect(newState.expression.downsampled.lastFetchSettings).toEqual({ selectedCellSet: 'louvain' });
  });

  it('preserves full expression state', () => {
    const action = makeAction();
    const newState = heatmapExpressionLoaded(baseState, action);
    expect(newState.expression.full).toBe(baseState.expression.full);
  });

  it('does not overwrite metadata when newGenes is null', () => {
    baseState.expression.downsampled.cellIds = [5, 6, 7];
    baseState.expression.downsampled.downsampleType = 'precomputed';

    const action = makeAction({
      newGenes: null,
      cellIds: [0, 1, 2],
      isAppend: false,
    });
    const newState = heatmapExpressionLoaded(baseState, action);
    // When newGenes is null, the conditional `!isAppend && newGenes && {}` doesn't spread
    expect(newState.expression.downsampled.cellIds).toEqual([5, 6, 7]);
    expect(newState.expression.downsampled.downsampleType).toBe('precomputed');
  });
});
