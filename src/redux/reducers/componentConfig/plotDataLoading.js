import { initialPlotDataState } from './initialState';

const plotDataLoading = (state, action) => {
  const { plotUuid } = action.payload;
  return {
    ...state,
    [plotUuid]: {
      ...initialPlotDataState,
      ...state[plotUuid],
      loading: true,
      error: false,
    },
  };
};

export default plotDataLoading;
