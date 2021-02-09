/* eslint-disable import/no-named-as-default-member */
import initialState from './initialState';

const completeProcessingStep = (state, action) => {
  const { settingName, numSteps } = action.payload;

  const newStepsDone = new Set([...state.processing.meta.stepsDone, settingName]);

  return {
    ...initialState,
    ...state,
    processing: {
      ...initialState.processing,
      ...state.processing,
      meta: {
        ...initialState.processing.meta,
        ...state.processing.meta,
        complete: newStepsDone.size === numSteps,
        stepsDone: newStepsDone,
      },
    },
  };
};

export default completeProcessingStep;
