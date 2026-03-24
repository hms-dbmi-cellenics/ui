import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import initialState from '../../reducers/cellSets/initialState';

const getCellSets = () => (state) => {
  const stateToReturn = (Object.keys(state).length ? state : initialState);

  const accessible = !stateToReturn.loading
    && !stateToReturn.initialLoadPending
    && !stateToReturn.updatingClustering
    && !stateToReturn.error;

  return {
    ...stateToReturn,
    accessible,
  };
};

// Granular selector to prevent re-renders when only selection changes
const getCellSetsSelected = () => (state) => {
  const stateToReturn = (Object.keys(state).length ? state : initialState);
  return stateToReturn.selected;
};

export default createMemoizedSelector(getCellSets);
export const getCellSetsSelectedExport = createMemoizedSelector(getCellSetsSelected);
