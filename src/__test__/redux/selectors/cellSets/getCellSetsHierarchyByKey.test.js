import { getCellSetsHierarchyByKey } from 'redux/selectors';
import mockCellSets from 'utils/tests/mockStores/cellSets';

describe('Get cell sets hierarchy selector by key test', () => {
  it('returns correctly by one key', () => {
    const returnedHierarchy = getCellSetsHierarchyByKey(['anotherTest'])(mockCellSets());
    expect(returnedHierarchy).toMatchSnapshot();
  });
  it('returns correctly by more than one key', () => {
    const returnedHierarchy = getCellSetsHierarchyByKey(['test', 'anotherTest'])(mockCellSets());
    expect(returnedHierarchy).toMatchSnapshot();
  });
});
