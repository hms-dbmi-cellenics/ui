import { UPDATE_CONFIG } from '../../actionTypes/componentConfig';

const updatePlotData = (plotUuid, dataChanges) => (dispatch) => {
  dispatch({
    type: UPDATE_CONFIG,
    payload:
      { plotUuid, dataChanges },
  });
};

export default updatePlotData;
