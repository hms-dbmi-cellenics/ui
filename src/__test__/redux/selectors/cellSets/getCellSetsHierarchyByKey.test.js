import { getCellSetsHierarchyByKeys } from 'redux/selectors';
import { mockCellSets1 } from '__test__/test-utils/cellSets.mock';

describe('Get cell sets hierarchy selector by key test', () => {
  it('returns correctly by one key', () => {
    const returnedHierarchy = getCellSetsHierarchyByKeys(['anotherTest'])(mockCellSets1);
    expect(returnedHierarchy).toMatchSnapshot();
  });
  it('returns correctly by more than one key', () => {
    const returnedHierarchy = getCellSetsHierarchyByKeys(['test', 'anotherTest'])(mockCellSets1);
    expect(returnedHierarchy).toMatchSnapshot();
  });
});
