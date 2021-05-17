import saveExperiment from './saveExperiment';
import {
  EXPERIMENTS_UPDATE,
} from '../../actionTypes/experiments';
import pushNotificationMessage from '../notifications';
import errorTypes from './errorTypes';

const updateExperiment = (
  experimentId,
  experiment,
) => async (dispatch) => {
  try {
    dispatch(saveExperiment(experimentId));

    dispatch({
      type: EXPERIMENTS_UPDATE,
      payload: {
        experimentId,
        experiment,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', errorTypes.SAVE_EXPERIMENT);
  }
};

export default updateExperiment;
