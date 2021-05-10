import saveExperiment from './saveExperiment';
import {
  EXPERIMENTS_UPDATE,
} from '../../actionTypes/experiments';

const updateExperiment = (
  experimentId,
  experiment,
) => async (dispatch) => {
  dispatch({
    type: EXPERIMENTS_UPDATE,
    payload: {
      experimentId,
      experiment,
    },
  });

  // dispatch(saveExperiment(experiment));
};

export default updateExperiment;
