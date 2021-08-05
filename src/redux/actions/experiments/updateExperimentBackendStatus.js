import {
  EXPERIMENTS_BACKEND_STATUS_UPDATED,
} from '../../actionTypes/experiments';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';

const updateExperimentBackendStatus = (
  experimentId,
  backendStatus,
) => async (dispatch) => {
  try {
    dispatch({
      type: EXPERIMENTS_BACKEND_STATUS_UPDATED,
      payload: {
        experimentId,
        backendStatus,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_FETCHING_BACKEND_STATUS);
  }
};

export default updateExperimentBackendStatus;
