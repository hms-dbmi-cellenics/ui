import { UPDATE_CONFIG } from '../../actionTypes/componentConfig';

const updatePlotConfig = (plotUuid, configChange) => (dispatch) => {
  dispatch({
    type: UPDATE_CONFIG,
    payload:
      { plotUuid, configChange },
  });
};

export default updatePlotConfig;
