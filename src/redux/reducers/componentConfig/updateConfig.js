import _ from 'lodash';
import { mergeObjectReplacingArrays } from 'utils/arrayUtils';

const updateConfig = (state, action) => {
  const { plotUuid, configChanges = null, dataChanges = null } = action.payload;

  let newConfig = _.cloneDeep(state[plotUuid]?.config);

  if (configChanges) {
    newConfig = mergeObjectReplacingArrays(newConfig, configChanges);
  }

  const newData = dataChanges ?? state[plotUuid]?.plotData;

  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      config: newConfig,
      plotData: newData,
      outstandingChanges: true,
    },
  };
};

export default updateConfig;
