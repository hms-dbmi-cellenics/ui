import initialState from './initialState';

const updateExperimentInfo = (state, action) => {
  const { experimentId, experimentName } = action.payload;

  return {
    ...initialState,
    ...state,
    info: {
      ...initialState.info,
      ...state.info,
      experimentId,
      experimentName,
    },
  };
};

export default updateExperimentInfo;
