import getContainingCellSetsProperties from 'utils/cellSets/getContainingCellSetsProperties';
import { mockCellSets } from '__test__/test-utils/cellSets.mock';

describe('get cell class properties tests', () => {
  it('returns information for a passed cellId', () => {
    const cellId = 3;
    const cellSetClassKeys = ['test'];
    const result = getContainingCellSetsProperties(cellId, cellSetClassKeys, mockCellSets);

    expect(result).toMatchSnapshot();
  });
});
