import { initialPlotDataState } from './initialState';

const plotDataError = (state, action) => {
  const { plotUuid } = action.payload;
  return {
    ...state,
    [plotUuid]: {
      ...initialPlotDataState,
      ...state[plotUuid],
      loading: false,
      error: true,
    },
  };
};

export default plotDataError;
