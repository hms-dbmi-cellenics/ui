import initialState from './initialState';

const projectsRestore = (state, action) => ({
  ...initialState,
  ...state,
  ...action.payload.state,
});

export default projectsRestore;
