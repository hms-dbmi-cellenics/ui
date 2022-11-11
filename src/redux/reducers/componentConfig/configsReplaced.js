/* eslint-disable no-param-reassign */
import produce, { original } from 'immer';
import _ from 'lodash';

import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

const configsReplaced = produce((draft, action) => {
  const { updatedConfigs } = action.payload;

  const originalState = original(draft);

  updatedConfigs.forEach(({ plotId, updatedConfig }) => {
    // If config is not loaded, no need to update it
    if (_.isNil(originalState[plotId])) return;

    const { plotType } = originalState[plotId];

    const newConfig = _.merge({}, initialPlotConfigStates[plotType], updatedConfig);
    draft[plotId].config = newConfig;
  });
});

export default configsReplaced;
