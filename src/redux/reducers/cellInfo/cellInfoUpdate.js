const cellInfoUpdate = (state, action) => ({
  ...state,
  ...action.payload,
});

export default cellInfoUpdate;
