import { createSelector } from 'reselect';

import initialState from '../../reducers/cellSets/initialState';

const outputGetCellSets = (cellSets) => (Object.keys(cellSets).length ? cellSets : initialState);

const getCellSets = () => createSelector(
  (cellSets) => cellSets,
  outputGetCellSets,
);

export default getCellSets;
