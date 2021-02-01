import _ from 'lodash';

const updateStylingConfig = (state, action) => {
  const {
    configChange,
  } = action.payload;

  const newConfig = _.cloneDeep(_.merge(state, configChange));

  return {
    ...state,
    ...newConfig,
  };
};

export default updateStylingConfig;
