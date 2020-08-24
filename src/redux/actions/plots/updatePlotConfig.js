import PLOT_CONFIG_UPDATE from '../../actionTypes/plots';

const updatePlotConfig = (plotUuid, configChange) => (dispatch) => {
  dispatch({
    type: PLOT_CONFIG_UPDATE,
    payload:
      { plotUuid, configChange },
  });
};

export default updatePlotConfig;
