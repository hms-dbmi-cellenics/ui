const cellMetaLoaded = (state, action) => {
  const { metaName, data } = action.payload;

  return {
    ...state,
    [metaName]: {
      ...state[metaName],
      loading: false,
      error: false,
      data,
    },
  };
};

export default cellMetaLoaded;
