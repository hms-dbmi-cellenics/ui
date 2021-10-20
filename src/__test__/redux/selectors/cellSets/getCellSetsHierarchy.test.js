import { getCellSetsHierarchyByType } from 'redux/selectors';
import mockCellSets from 'utils/tests/mockStores/cellSets';

describe('Get cell sets hierarchy selector test', () => {
  it('returns only selected cellset types', () => {
    const returnedHierarchy = getCellSetsHierarchyByType(['firstType'])(mockCellSets());
    expect(returnedHierarchy).toMatchSnapshot();
  });
  it('Returns all if no type provided', () => {
    const returnedHierarchy = getCellSetsHierarchyByType()(mockCellSets());
    expect(returnedHierarchy).toMatchSnapshot();
  });
});
