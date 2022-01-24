/* eslint-disable no-param-reassign */
import _ from 'lodash';
import produce from 'immer';

import initialState from 'redux/reducers/cellSets/initialState';

const cellSetsUpdateProperty = produce((draft, action) => {
  const { cellSetKey, dataUpdated } = action.payload;

  // Adding original because jest fails otherwise, but in reality it works also without original
  _.merge(draft.properties[cellSetKey], dataUpdated);
}, initialState);

export default cellSetsUpdateProperty;
