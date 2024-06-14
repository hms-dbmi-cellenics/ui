import loadCellSets from 'redux/actions/cellSets/loadCellSets';
import { getCellSetsHierarchy, getCellSetsHierarchyByKeys } from 'redux/selectors';

// Check that the cell sets within the selected selectedCellSet and grouped tracks didn't change
// e.g., if cell set was deleted we can't use cache
const getCellSetsThatAffectDownsampling = async (
  experimentId, selectedCellSetKey, groupedTracks, dispatch, getState) => {
  await dispatch(loadCellSets(experimentId));

  const [{ children }] = getCellSetsHierarchyByKeys([selectedCellSetKey])(getState());

  const selectedCellSetsKeys = children.map((cellSet) => cellSet.key);

  const groupedCellSetKeys = getCellSetsHierarchy(groupedTracks)(getState())
    .map((cellClass) => cellClass?.children)
    .flat()
    .map(({ key }) => key);

  // Keep them in separate lists, they each represent different changes in the settings
  return [selectedCellSetsKeys, groupedCellSetKeys];
};

export default getCellSetsThatAffectDownsampling;
