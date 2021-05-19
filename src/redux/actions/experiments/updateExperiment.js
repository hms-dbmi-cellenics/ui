import saveExperiment from './saveExperiment';
import {
  EXPERIMENTS_UPDATED,
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
      type: EXPERIMENTS_UPDATED,
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
