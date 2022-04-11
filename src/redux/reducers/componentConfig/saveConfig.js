/* eslint-disable no-param-reassign */
import produce, { setAutoFreeze } from 'immer';

import initialState from 'redux/reducers/componentConfig/initialState';

// Vega modifies the plot config object, so we need to disable Immer autofreeze.
// If we don't do this, the reducer will freeze the object and the plot will not update.
setAutoFreeze(false);

const saveConfig = produce((draft, action) => {
  const { plotUuid, success } = action.payload;

  draft[plotUuid].outstandingChanges = success;
}, initialState);

export default saveConfig;
