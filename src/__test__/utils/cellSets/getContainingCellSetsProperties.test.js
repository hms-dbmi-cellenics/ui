import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';
import mockCellSets from 'utils/tests/mockStores/cellSets';

describe('get cell class properties tests', () => {
  const { cellSets } = mockCellSets();
  it('returns information for a passed cellId', () => {
    const cellId = 3;
    const cellSetClassKeys = ['test'];
    const result = getContainingCellSetsProperties(cellId, cellSetClassKeys, cellSets);

    expect(result).toMatchSnapshot();
  });
});
