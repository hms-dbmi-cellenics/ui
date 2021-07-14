const markerGenesLoading = (state) => ({
  ...state,
  markers: {
    ...state.markers,
    needToBeLoaded: true,
    error: true,
  },
});

export default markerGenesLoading;
