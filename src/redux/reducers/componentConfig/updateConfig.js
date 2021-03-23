import _ from 'lodash';

const updateConfig = (state, action) => {
  const { plotUuid, configChanges = null, dataChanges = null } = action.payload;
  const newConfig = _.cloneDeep(state[plotUuid]?.config);

  const mergeConfig = (objValue, srcValue) => {
    if (_.isArray(objValue) && srcValue) {
      return srcValue;
    }
  };

  if (configChanges) {
    _.mergeWith(newConfig, configChanges, mergeConfig);
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
