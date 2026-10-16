import _ from 'lodash';
import { mergeObjectReplacingArrays } from 'utils/arrayUtils';
import expandColumnarPlotData from 'utils/plotData/expandColumnarPlotData';

const updateConfig = (state, action) => {
  const { plotUuid, configChanges = null, dataChanges = null } = action.payload;

  let newConfig = _.cloneDeep(state[plotUuid]?.config);

  if (configChanges) {
    newConfig = mergeObjectReplacingArrays(newConfig, configChanges);
  }

  const newData = expandColumnarPlotData(dataChanges) ?? state[plotUuid]?.plotData;

  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      config: newConfig,
      plotData: newData,
      // plot data is never saved (see savePlotConfig), so only config changes
      // leave something to save
      outstandingChanges: configChanges ? true : Boolean(state[plotUuid]?.outstandingChanges),
    },
  };
};

export default updateConfig;
