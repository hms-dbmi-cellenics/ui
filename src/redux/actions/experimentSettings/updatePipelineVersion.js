import {
  EXPERIMENT_SETTINGS_PIPELINE_VERSION_UPDATED,
} from '../../actionTypes/experimentSettings';

const updatePipelineVersion = (experimentId, pipelineVersion) => async (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_PIPELINE_VERSION_UPDATED,
    payload: { experimentId, pipelineVersion },
  });
};

export default updatePipelineVersion;
