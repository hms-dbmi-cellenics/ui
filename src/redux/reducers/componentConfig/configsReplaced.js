/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';
import _ from 'lodash';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

const configsReplaced = produce((draft, action) => {
  const { updatedConfigs } = action.payload;

  const originalState = original(draft);

  updatedConfigs.forEach(({ id, updatedConfig }) => {
    // If config is not loaded, no need to update it
    if (_.isNil(originalState[id])) return;

    const { plotType } = originalState[id];

    const newConfig = _.merge({}, initialPlotConfigStates[plotType], updatedConfig);

    draft[id].config = newConfig;
  });
});

export default configsReplaced;
