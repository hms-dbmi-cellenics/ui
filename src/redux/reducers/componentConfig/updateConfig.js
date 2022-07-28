import _ from 'lodash';
import mergeObjectReplacingArrays from 'utils/mergeObjectReplacingArrays';

const updateConfig = (state, action) => {
  const { plotUuid, configChanges = null, dataChanges = null } = action.payload;
  console.time('updateConfig');
  let newConfig = _.cloneDeep(state[plotUuid]?.config);

  if (configChanges) {
    newConfig = mergeObjectReplacingArrays(newConfig, configChanges);
  }
  console.log('CONFIG CHANGES AND DATACHANGES   ', configChanges, dataChanges);
  console.timeEnd('updateConfig');
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
