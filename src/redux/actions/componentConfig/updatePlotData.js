import { UPDATE_CONFIG } from '../../actionTypes/componentConfig';

const updatePlotData = (plotUuid, dataChange) => (dispatch) => {
  dispatch({
    type: UPDATE_CONFIG,
    payload:
      { plotUuid, dataChange },
  });
};

export default updatePlotData;
