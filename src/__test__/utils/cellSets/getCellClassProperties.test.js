import getCellClassProperties from 'utils/cellSets/getCellClassProperties';
import mockCellSets from 'utils/tests/mockStores/cellSets';

describe('get cell class properties tests', () => {
  const { cellSets } = mockCellSets();
  it('returns information for a passed cellId', () => {
    // doing it as a string to make sure it still works (sometimes a string is passed from vitessce)
    const cellId = '3';
    const cellSetClassKeys = ['test'];
    const result = getCellClassProperties(cellId, cellSetClassKeys, cellSets);
    expect(result).toMatchSnapshot();
  });
});
