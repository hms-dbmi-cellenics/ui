import { initialPlotDataState } from './initialState';

const plotDataLoaded = (state, action) => {
  const { plotUuid, plotData } = action.payload;
  return {
    ...state,
    [plotUuid]: {
      ...initialPlotDataState,
      ...state[plotUuid],
      plotData,
      loading: false,
      error: false,
    },
  };
};

export default plotDataLoaded;
