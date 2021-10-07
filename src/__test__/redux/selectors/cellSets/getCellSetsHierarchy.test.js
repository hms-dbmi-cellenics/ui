import { getCellSetsHierarchy } from 'redux/selectors';
import mockCellSets from 'utils/tests/mockStores/cellSets';

describe('Get cell sets hierarchy selector test', () => {
  it('returns only selected cellset types', () => {
    const returnedHierarchy = getCellSetsHierarchy(['firstType'])(mockCellSets());
    expect(returnedHierarchy).toMatchSnapshot();
  });
  it('Returns all if no type provided', () => {
    const returnedHierarchy = getCellSetsHierarchy()(mockCellSets());
    expect(returnedHierarchy).toMatchSnapshot();
  });
});
