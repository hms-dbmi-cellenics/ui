import { EXPERIMENTS_SWITCH } from 'redux/actionTypes/experiments';
import {
  EXPERIMENT_SETTINGS_INFO_UPDATE,
} from 'redux/actionTypes/experimentSettings';

const switchExperiment = (experimentId) => async (dispatch, getState) => {
  const {
    name, sampleIds, pipelineVersion,
  } = getState().experiments[experimentId];

  dispatch({
    type: EXPERIMENTS_SWITCH,
  });

  dispatch({
    type: EXPERIMENT_SETTINGS_INFO_UPDATE,
    payload: {
      experimentId,
      experimentName: name,
      sampleIds,
      pipelineVersion,
    },
  });
};
export default switchExperiment;
