const markerGenesLoading = (state) => ({
  ...state,
  markers: {
    ...state.markers,
    needToBeLoaded: true,
    error: false,
  },
});

export default markerGenesLoading;
