import {
  EXPERIMENTS_UPDATED,
} from '../../actionTypes/experiments';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import saveExperiment from './saveExperiment';

const updateExperiment = (
  experimentId,
  experiment,
) => async (dispatch) => {
  try {
    dispatch({
      type: EXPERIMENTS_UPDATED,
      payload: {
        experimentId,
        experiment,
      },
    });

    dispatch(saveExperiment(experimentId));
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default updateExperiment;
