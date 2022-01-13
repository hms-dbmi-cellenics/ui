/* eslint-disable no-param-reassign */
import _ from 'lodash';
import produce from 'immer';

import initialState from 'redux/reducers/cellSets/initialState';

const cellSetsUpdateProperty = produce((draft, action) => {
  const { key, dataUpdated } = action.payload;

  _.merge(draft.properties[key], dataUpdated);
}, initialState);

export default cellSetsUpdateProperty;
