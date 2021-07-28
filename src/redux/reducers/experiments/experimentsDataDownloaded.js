const experimentsDataDownload = (state, action) => {
  const { type } = action.payload;

  return {
    ...state,
    meta: {
      ...state.meta,
      download: {
        ...state.meta.download,
        [type]: {
          loading: false,
          ready: false,
          error: false,
        },
      },
    },
  };
};

export default experimentsDataDownload;
