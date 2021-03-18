import _ from 'lodash';

const updateConfig = (state, action) => {
  const { plotUuid, configChange = null, dataChange = null } = action.payload;
  let newConfig = state[plotUuid].config;
  if (configChange) {
    newConfig = _.cloneDeep(state[plotUuid].config);
    _.merge(newConfig, configChange);
  }

  const newData = dataChange ?? state[plotUuid].plotData;

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
