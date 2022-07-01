import {
  EXPERIMENTS_SET_ACTIVE,
} from 'redux/actionTypes/experiments';

const setActiveExperiment = (
  experimentId,
) => async (dispatch, getState) => {
  const {
    activeExperimentId,
  } = getState().experiments.meta;

  if (activeExperimentId === experimentId) return null;

  dispatch({
    type: EXPERIMENTS_SET_ACTIVE,
    payload: { experimentId },
  });
};

export default setActiveExperiment;
