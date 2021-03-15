import {
  EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADED,
} from '../../actionTypes/experimentSettings';

const updatePipelineStatus = (experimentId, status) => async (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_PIPELINE_STATUS_LOADED,
    payload: {
      experimentId,
      status,
    },
  });
};

export default updatePipelineStatus;
