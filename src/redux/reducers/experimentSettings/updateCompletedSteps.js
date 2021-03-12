/* eslint-disable import/no-named-as-default-member */
import initialState from './initialState';

const updateCompletedSteps = (state, action) => {
  const { completedSteps, numSteps } = action.payload;

  const newStepsDone = new Set(completedSteps);

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
        completingStepError: false,
      },
    },
  };
};

export default updateCompletedSteps;
