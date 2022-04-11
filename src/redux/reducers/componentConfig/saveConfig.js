/* eslint-disable no-param-reassign */
import produce from 'immer';

import initialState from 'redux/reducers/componentConfig/initialState';

const saveConfig = produce((draft, action) => {
  const { plotUuid, success } = action;
  draft[plotUuid].outstandingChanges = success;
}, initialState);

export default saveConfig;
