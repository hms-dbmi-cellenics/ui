import initialState from './initialState';

const cellInfoUnfocus = (state) => ({
  ...state,
  focus: {
    ...initialState.focus,
  },
});

export default cellInfoUnfocus;
