// import _ from 'lodash';
// import { createSelector } from 'reselect';

import initialState from '../../reducers/cellSets/initialState';

const getCellSets = () => (state) => (Object.keys(state).length ? state : initialState);

// const cellSetsSelector = (state) => state;

// const getCellSets = () => createSelector(
//   (state) => state,
//   (state) => (Object.keys(state).length ? state : initialState),
// );

export default getCellSets;
