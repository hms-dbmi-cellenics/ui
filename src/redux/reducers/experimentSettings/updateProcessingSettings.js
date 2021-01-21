import _ from 'lodash';
import initialState from './initialState';

const updateProcessingSettings = (state, action) => {
  const { settingName, configChange } = action.payload;

  const newConfig = _.merge(state.processing[settingName], configChange);

  return {
    ...initialState,
    ...state,
    processing: {
      ...initialState.processing,
      ...state.processing,
      [settingName]: {
        ...initialState.processing[settingName],
        ...newConfig,
      },
    },
  };
};

export default updateProcessingSettings;
