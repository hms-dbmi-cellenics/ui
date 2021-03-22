import _ from 'lodash';

const updateConfig = (state, action) => {
  const { plotUuid, configChanges = null, dataChanges = null } = action.payload;
  let newConfig = state[plotUuid]?.config;
  if (configChanges) {
    newConfig = _.cloneDeep(state[plotUuid].config);
    _.merge(newConfig, configChanges);
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
