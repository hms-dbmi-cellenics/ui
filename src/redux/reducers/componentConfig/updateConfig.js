import _ from 'lodash';

const updateConfig = (state, action) => {
  const { plotUuid, configChange } = action.payload;

  const newConfig = _.cloneDeep(state[plotUuid].config);

  const mergeConfig = (objValue, srcValue) => {
    if (_.isArray(objValue) && srcValue) {
      return srcValue;
    }
  };

  _.mergeWith(newConfig, configChange, mergeConfig);

  return {
    ...state,
    [plotUuid]: {
      ...state[plotUuid],
      config: newConfig,
      outstandingChanges: true,
    },
  };
};

export default updateConfig;
