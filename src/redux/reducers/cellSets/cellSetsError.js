import initialState from './initialState';

const cellSetsError = (state, action) => {
  const { error } = action.payload;

  return {
    ...initialState,
    loading: false,
    error: error ?? true,
  };
};

export default cellSetsError;
