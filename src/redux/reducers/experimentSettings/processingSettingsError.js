import initialState from './initialState';

const processingSettingsError = (state, action) => {
  const { error } = action.payload;

  return {
    ...initialState,
    ...state,
    processing: {
      ...initialState.meta,
      error,
    },
  };
};

export default processingSettingsError;
