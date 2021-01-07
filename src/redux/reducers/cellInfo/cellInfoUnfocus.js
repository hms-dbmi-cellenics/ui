const cellInfoUnfocus = (state) => ({
  ...state,
  focus: {
    store: null,
    key: null,
  },
});

export default cellInfoUnfocus;
