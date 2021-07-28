const experimentsDownloadStarted = (state, action) => {
  const { type } = action.payload;

  return {
    ...state,
    meta: {
      ...state.meta,
      download: {
        ...state.meta.download,
        [type]: {
          loading: false,
          error: false,
        },
      },
    },
  };
};

export default experimentsDownloadStarted;
