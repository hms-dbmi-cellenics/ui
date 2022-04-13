/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from 'redux/reducers/componentConfig/initialState';

const resetConfig = produce((draft, action) => {
  const { plotUuid, config } = action.payload;
  draft[plotUuid].config = config;
  draft[plotUuid].outstandingChanges = false;
}, initialState);

export default resetConfig;
