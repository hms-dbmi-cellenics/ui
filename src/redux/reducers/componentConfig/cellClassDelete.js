/* eslint-disable no-param-reassign */
import produce from 'immer';
import _ from 'lodash';

import initialState from 'redux/reducers/componentConfig/initialState';

// Necessary for the interactiveHeatmap, it can't get invalidated
// as easily as other plots (from the api) because it is not persisted
const cellClassDelete = produce((draft, action) => {
  const { key: cellClassKey } = action.payload;

  Object.values(draft).forEach((value) => {
    if (value.config.groupedTracks) {
      _.pull(value.config.groupedTracks, cellClassKey);
    }
  });
}, initialState);

export default cellClassDelete;
