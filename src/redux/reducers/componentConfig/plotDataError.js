import { initialPlotDataState } from './initialState';

const plotDataError = (state, action) => {
  const { plotUuid, error } = action.payload;
  return {
    ...state,
    [plotUuid]: {
      ...initialPlotDataState,
      ...state[plotUuid],
      loading: false,
      error,
    },
  };
};

export default plotDataError;
