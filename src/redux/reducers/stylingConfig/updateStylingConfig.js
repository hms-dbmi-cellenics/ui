import _ from 'lodash';
import initialState from './initialState';

const updateStylingConfig = (state, action) => {
  const {
    moduleName, plotUUID, settingName, configChange,
  } = action.payload;

  const newConfig = _.cloneDeep(_.merge(state[moduleName][plotUUID][settingName], configChange));

  return {
    ...initialState,
    ...state,
    [moduleName]: {
      ...state[moduleName],
      [plotUUID]: {
        ...state[moduleName][plotUUID],
        [settingName]: {
          ...initialState[moduleName][plotUUID][settingName],
          ...newConfig,
        },
      },
    },
  };
};

export default updateStylingConfig;
