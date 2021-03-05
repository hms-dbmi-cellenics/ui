import { EXPERIMENT_SETTINGS_PIPELINE_STATUS_UPDATE } from '../../actionTypes/experimentSettings';

const updatePipelineStatus = (experimentId, status) => (dispatch) => {
  // if (!status) {
  //   return;
  // }

  dispatch({
    type: EXPERIMENT_SETTINGS_PIPELINE_STATUS_UPDATE,
    payload:
      { experimentId, status },
  });
};

export default updatePipelineStatus;
