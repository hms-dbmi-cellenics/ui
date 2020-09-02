import { UPDATE_PLOT_CONFIG } from '../../actionTypes/plots';

const updatePlotConfig = (plotUuid, configChange) => (dispatch) => {
  dispatch({
    type: UPDATE_PLOT_CONFIG,
    payload:
      { plotUuid, configChange },
  });
};

export default updatePlotConfig;
