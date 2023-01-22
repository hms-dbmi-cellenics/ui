import createMemoizedSelector from 'redux/selectors/createMemoizedSelector';

import initialState from '../../reducers/cellSets/initialState';

const getCellSets = () => (state) => {
  const stateToReturn = (Object.keys(state).length ? state : initialState);

  const accessible = !stateToReturn.loading
    && !stateToReturn.initialLoadPending
    && !stateToReturn.updatingClustering
    && !stateToReturn.error;

  const toReturn = {
    ...stateToReturn,
    accessible,
  };

  console.log('IVA **** ', toReturn);

  return toReturn;
};

export default createMemoizedSelector(getCellSets);
