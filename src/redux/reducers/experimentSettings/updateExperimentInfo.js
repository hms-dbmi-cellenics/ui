import initialState from './initialState';

const updateExperimentInfo = (state, action) => ({
  ...initialState,
  ...state,
  info: {
    ...initialState.info,
    ...state.info,
    ...action.payload,
  },
});

export default updateExperimentInfo;
