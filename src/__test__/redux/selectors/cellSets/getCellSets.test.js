/* eslint-disable import/no-unresolved */
import initialCellSetsState from 'redux/reducers/cellSets/initialState';
import getCellSets from 'redux/selectors/cellSets/getCellSets';

describe('Get cell sets selector test', () => {
  const mockCellSets = {
    ...initialCellSetsState,
    properties: {
      test: {
        name: 'Test',
        cellIds: new Set(),
      },
      'test-1': {
        name: 'Test-1',
        cellIds: new Set([1, 2, 3]),
      },
      'test-2': {
        name: 'Test-1',
        cellIds: new Set([4, 5, 6]),
      },
    },
    hierarchy: [
      {
        key: 'test',
        children: [
          { key: 'test-1' },
          { key: 'test-2' },
        ],
      },
    ],
    loading: false,
    error: false,
  };

  it('should return store cellsets if available', () => {
    expect(getCellSets()(mockCellSets)).toEqual(mockCellSets);
  });
  it('should return default cell sets if unavailable', () => {
    expect(getCellSets()({})).toEqual(initialCellSetsState);
  });
});
