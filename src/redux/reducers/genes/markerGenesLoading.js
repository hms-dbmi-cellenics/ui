const markerGenesLoading = (state) => ({
  ...state,
  markers: {
    ...state.markers,
    loading: true,
    error: false,
  },
});

export default markerGenesLoading;
