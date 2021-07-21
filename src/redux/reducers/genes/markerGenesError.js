const markerGenesError = (state) => ({
  ...state,
  markers: {
    ...state.markers,
    loading: true,
    error: true,
  },
});

export default markerGenesError;
