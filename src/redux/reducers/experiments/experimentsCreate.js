import initialState from './initialState';

const experimentCreate = (state, action) => {
  const { experiment } = action.payload;

  return {
    ...initialState,
    ...state,
    ids: [...state.ids, experiment.id],
    [experiment.id]: experiment,
  };
};

export default experimentCreate;
