import initialState from './initialState';
import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';

const updateProcessingSettings = (state, action) => {
  const { settingName, configChange } = action.payload;

  const newConfig = mergeObjectWithArrays(
    state.processing[settingName],
    configChange,
  );

  return {
    ...initialState,
    ...state,
    processing: {
      ...initialState.processing,
      ...state.processing,
      [settingName]: {
        ...state.processing[settingName],
        ...newConfig,
      },
    },
  };
};

export default updateProcessingSettings;
