import { initialPlotDataState } from 'redux/reducers/componentConfig/initialState';
import expandColumnarPlotData from 'utils/plotData/expandColumnarPlotData';

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
      plotData: expandColumnarPlotData(plotData),
      config,
      outstandingChanges: false,
    },
  };
};

export default loadPlotConfig;
