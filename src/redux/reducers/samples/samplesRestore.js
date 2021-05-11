import initialState from './initialState';

const samplesRestore = (state, action) => ({
  ...initialState,
  ...state,
  ...action.payload.state,
});

export default samplesRestore;
