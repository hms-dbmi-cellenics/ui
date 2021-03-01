const cellMetaError = (state, action) => {
  const { metaName, error } = action.payload;

  return {
    ...state,
    [metaName]: {
      ...state[metaName],
      loading: false,
      error,
    },
  };
};

export default cellMetaError;
