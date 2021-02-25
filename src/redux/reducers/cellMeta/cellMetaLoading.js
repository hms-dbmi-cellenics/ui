const cellMetaLoading = (state, action) => {
  const { metaName } = action.payload;

  return {
    ...state,
    [metaName]: {
      ...state[metaName],
      loading: true,
    },
  };
};

export default cellMetaLoading;
