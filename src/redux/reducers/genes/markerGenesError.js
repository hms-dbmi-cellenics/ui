const markerGenesLoading = (state) => ({
  ...state,
  markers: {
    ...state.markers,
    loading: true,
    error: true,
  },
});

export default markerGenesLoading;
