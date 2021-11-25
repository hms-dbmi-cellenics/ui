import { initialPlotDataState } from 'redux/reducers/componentConfig/initialState';

const loadPlotConfig = (state, action) => {
  const {
    experimentId,
    plotUuid,
    plotType,
    plotData,
    config,
  } = action.payload;

  return {
    ...state,
    [plotUuid]: {
      ...initialPlotDataState,
      ...state[plotUuid],
      experimentId,
      plotType,
      plotData,
      config,
      outstandingChanges: false,
    },
  };
};

export default loadPlotConfig;
