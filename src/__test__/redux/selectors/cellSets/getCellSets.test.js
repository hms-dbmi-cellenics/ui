import initialCellSetsState from 'redux/reducers/cellSets/initialState';
import { mockCellSets } from '__test__/test-utils/cellSets.mock';
import getCellSets from 'redux/selectors/cellSets/getCellSets';

describe('Get cell sets selector test', () => {
  it('should return store cellsets if available', () => {
    expect(getCellSets()(mockCellSets)).toEqual({
      ...mockCellSets,
      accessible: true,
    });
  });

  it('should return default cell sets if unavailable', () => {
    expect(getCellSets()({})).toEqual({
      ...initialCellSetsState,
      accessible: false,
    });
  });
});
