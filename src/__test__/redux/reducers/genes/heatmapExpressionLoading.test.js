import heatmapExpressionLoading from 'redux/reducers/genes/heatmapExpressionLoading';

describe('heatmapExpressionLoading', () => {
  const baseState = {
    expression: {
      full: { matrix: {}, loading: [], error: false },
      downsampled: {
        loading: false,
        error: false,
        matrix: {},
        cellIds: null,
        downsampleType: null,
        lastFetchSettings: null,
      },
    },
  };

  it('sets downsampled.loading to true', () => {
    const newState = heatmapExpressionLoading(baseState);
    expect(newState.expression.downsampled.loading).toBe(true);
  });

  it('clears downsampled.error', () => {
    const stateWithError = {
      ...baseState,
      expression: {
        ...baseState.expression,
        downsampled: { ...baseState.expression.downsampled, error: new Error('previous') },
      },
    };
    const newState = heatmapExpressionLoading(stateWithError);
    expect(newState.expression.downsampled.error).toBe(false);
  });

  it('preserves rest of downsampled state', () => {
    const stateWithData = {
      ...baseState,
      expression: {
        ...baseState.expression,
        downsampled: {
          ...baseState.expression.downsampled,
          cellIds: [1, 2, 3],
          downsampleType: 'bucketed',
          lastFetchSettings: { selectedCellSet: 'louvain', groupedTracks: ['sample'] },
        },
      },
    };
    const newState = heatmapExpressionLoading(stateWithData);
    expect(newState.expression.downsampled.cellIds).toEqual([1, 2, 3]);
    expect(newState.expression.downsampled.downsampleType).toBe('bucketed');
    expect(newState.expression.downsampled.lastFetchSettings).toEqual({
      selectedCellSet: 'louvain', groupedTracks: ['sample'],
    });
  });

  it('preserves full expression state', () => {
    const newState = heatmapExpressionLoading(baseState);
    expect(newState.expression.full).toEqual(baseState.expression.full);
  });
});
