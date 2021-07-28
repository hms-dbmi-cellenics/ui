const experimentsDownloadRequested = (state, action) => {
  const { type } = action.payload;

  return {
    ...state,
    meta: {
      ...state.meta,
      download: {
        ...state.meta.download,
        [type]: {
          loading: true,
          error: false,
        },
      },
    },
  };
};

export default experimentsDownloadRequested;
