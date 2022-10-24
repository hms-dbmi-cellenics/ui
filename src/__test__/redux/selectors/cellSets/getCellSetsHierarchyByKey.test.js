import { getCellSetsHierarchyByKeys } from 'redux/selectors';
import { mockCellSets } from '__test__/test-utils/cellSets.mock';

describe('Get cell sets hierarchy selector by key test', () => {
  it('returns correctly by one key', () => {
    const returnedHierarchy = getCellSetsHierarchyByKeys(['louvain'])({ cellSets: mockCellSets });
    expect(returnedHierarchy).toMatchSnapshot();
  });

  it('returns correctly by more than one key', () => {
    const returnedHierarchy = getCellSetsHierarchyByKeys(['sample', 'scratchpad'])({ cellSets: mockCellSets });
    expect(returnedHierarchy).toMatchSnapshot();
  });

  it('returns in order of keys received', () => {
    const [sample1, scratchpad1] = getCellSetsHierarchyByKeys(['sample', 'scratchpad'])({ cellSets: mockCellSets });
    const [scratchpad2, sample2] = getCellSetsHierarchyByKeys(['scratchpad', 'sample'])({ cellSets: mockCellSets });

    expect(sample1).toEqual(sample2);
    expect(scratchpad1).toEqual(scratchpad2);
  });
});
