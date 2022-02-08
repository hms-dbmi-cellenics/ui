import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';
import { mockCellSets1 } from '__test__/test-utils/cellSets.mock';

describe('get cell class properties tests', () => {
  const { cellSets } = mockCellSets1;
  it('returns information for a passed cellId', () => {
    const cellId = 3;
    const cellSetClassKeys = ['test'];
    const result = getContainingCellSetsProperties(cellId, cellSetClassKeys, cellSets);

    expect(result).toMatchSnapshot();
  });
});
