import _ from 'lodash';

const updateConfig = (state, action) => {
  const { plotUuid, configChange } = action.payload;

  const newConfig = _.cloneDeep(state[plotUuid].config);
  _.merge(newConfig, configChange);

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
