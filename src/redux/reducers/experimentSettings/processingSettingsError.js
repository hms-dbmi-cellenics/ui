import initialState from './initialState';

const processingSettingsError = (state, action) => {
  const { error, errorType } = action.payload;

  return {
    ...initialState,
    ...state,
    processing: {
      ...state.processing,
      meta: {
        ...state.processing.meta,
        loading: false,
        [errorType]: error,
      },
    },
  };
};

export default processingSettingsError;
