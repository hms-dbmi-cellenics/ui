const markerGenesError = (state) => ({
  ...state,
  markers: {
    ...state.markers,
    loading: false,
    error: true,
  },
});

export default markerGenesError;
