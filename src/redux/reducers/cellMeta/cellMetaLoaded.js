const cellMetaLoaded = (state, action) => {
  const { metaName, data } = action.payload;

  return {
    ...state,
    [metaName]: {
      ...state[metaName],
      loading: false,
      data,
    },
  };
};

export default cellMetaLoaded;
