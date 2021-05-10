import initialState from './initialState';

const experimentUpdate = (state, action) => {
  const { experimentId, experiment } = action.payload;

  return {
    ...initialState,
    ...state,
    [experimentId]: {
      ...state[experimentId],
      ...experiment,
    },
  };
};

export default experimentUpdate;
