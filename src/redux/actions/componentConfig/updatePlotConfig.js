import { UPDATE_CONFIG } from '../../actionTypes/componentConfig';

const updatePlotConfig = (plotUuid, configChanges) => (dispatch) => {
  dispatch({
    type: UPDATE_CONFIG,
    payload:
      { plotUuid, configChanges },
  });
};

export default updatePlotConfig;
