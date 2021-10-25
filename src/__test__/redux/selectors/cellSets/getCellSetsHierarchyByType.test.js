import { getCellSetsHierarchyByType } from 'redux/selectors';
import mockCellSets from 'utils/tests/mockStores/cellSets';

describe('Get cell sets hierarchy selector by type test', () => {
  it('returns correctly by one key', () => {
    const returnedHierarchy = getCellSetsHierarchyByType(['firstType'])(mockCellSets());
    expect(returnedHierarchy).toMatchSnapshot();
  });
  it('returns correctly by more than one type', () => {
    const returnedHierarchy = getCellSetsHierarchyByType(['firstType', 'anotherType'])(mockCellSets());
    expect(returnedHierarchy).toMatchSnapshot();
  });
});
