import { getCellSetsHierarchyByType } from 'redux/selectors';
import { mockCellSets } from '__test__/test-utils/cellSets.mock';

describe('Get cell sets hierarchy selector by type test', () => {
  it('returns correctly by one key', () => {
    const returnedHierarchy = getCellSetsHierarchyByType('firstType')({ cellSets: { accessible: true, ...mockCellSets } });
    expect(returnedHierarchy).toMatchSnapshot();
  });
});
