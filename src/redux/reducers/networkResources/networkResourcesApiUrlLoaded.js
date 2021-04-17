const networkResourcesApiUrlLoaded = (state, action) => {
  const { apiUrl } = action.payload;

  return {
    ...state,
    apiUrl,
  };
};

export default networkResourcesApiUrlLoaded;
