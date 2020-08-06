import initialState from './initialState';

const cellSetsError = (state, action) => {
  const { error } = action.payload;

  return {
    ...initialState,
    loading: false,
    error,
  };
};

export default cellSetsError;
