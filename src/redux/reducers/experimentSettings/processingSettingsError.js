import initialState from './initialState';

const processingSettingsError = (state, action) => {
  const { error } = action.payload;

  return {
    ...initialState,
    ...state,
    processing: {
      ...state.processing,
      meta: {
        ...state.processing.meta,
        loading: false,
        error,
      },
    },
  };
};

export default processingSettingsError;
