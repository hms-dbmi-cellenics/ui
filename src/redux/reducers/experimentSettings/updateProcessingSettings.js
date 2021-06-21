import initialState from './initialState';
import mergeObjectWithArrays from '../../../utils/mergeObjectWithArrays';

const updateProcessingSettings = (state, action) => {
  const { step, configChange } = action.payload;

  const newConfig = mergeObjectWithArrays(
    state.processing[step],
    configChange,
  );

  return {
    ...initialState,
    ...state,
    processing: {
      ...initialState.processing,
      ...state.processing,
      [step]: {
        ...state.processing[step],
        ...newConfig,
      },
    },
  };
};

export default updateProcessingSettings;
