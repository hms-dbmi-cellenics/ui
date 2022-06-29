import {
  PROJECTS_SET_ACTIVE,
} from 'redux/actionTypes/projects';

const setActiveExperiment = (
  experimentId,
) => async (dispatch, getState) => {
  const {
    activeExperimentId,
  } = getState().experiments.meta;

  if (activeExperimentId === experimentId) return null;

  dispatch({
    type: PROJECTS_SET_ACTIVE,
    payload: { projectUuid: experimentId },
  });
};

export default setActiveExperiment;
