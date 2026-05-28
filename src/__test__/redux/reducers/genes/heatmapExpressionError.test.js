import heatmapExpressionError from 'redux/reducers/genes/heatmapExpressionError';

describe('heatmapExpressionError', () => {
  const baseState = {
    expression: {
      full: { matrix: {}, loading: [], error: false },
      downsampled: {
        loading: true,
        error: false,
        matrix: {},
        cellIds: [1, 2, 3],
        downsampleType: 'bucketed',
        lastFetchSettings: { selectedCellSet: 'louvain', groupedTracks: ['sample'] },
      },
    },
  };

  const testError = new Error('Work request failed');

  it('sets downsampled.error to the error from action payload', () => {
    const newState = heatmapExpressionError(baseState, { payload: { error: testError } });
    expect(newState.expression.downsampled.error).toBe(testError);
  });

  it('sets downsampled.loading to false', () => {
    const newState = heatmapExpressionError(baseState, { payload: { error: testError } });
    expect(newState.expression.downsampled.loading).toBe(false);
  });

  it('preserves existing downsampled data (cellIds, downsampleType, lastFetchSettings)', () => {
    const newState = heatmapExpressionError(baseState, { payload: { error: testError } });
    expect(newState.expression.downsampled.cellIds).toEqual([1, 2, 3]);
    expect(newState.expression.downsampled.downsampleType).toBe('bucketed');
    expect(newState.expression.downsampled.lastFetchSettings).toEqual({
      selectedCellSet: 'louvain', groupedTracks: ['sample'],
    });
  });

  it('preserves full expression state', () => {
    const newState = heatmapExpressionError(baseState, { payload: { error: testError } });
    expect(newState.expression.full).toEqual(baseState.expression.full);
  });
});
