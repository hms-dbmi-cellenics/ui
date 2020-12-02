import initialState from './initialState';

const cellInfoFocus = (state, action) => {
  const { store, key } = action.payload;

  return {
    ...state,
    focus: {
      ...initialState.focus,
      store,
      key,
    },
  };
};

export default cellInfoFocus;
