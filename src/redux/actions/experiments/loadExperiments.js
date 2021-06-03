import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import {
  EXPERIMENTS_LOADED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_LOADING,
} from '../../actionTypes/experiments';

const loadExperiments = (
  projectUuid,
) => async (dispatch) => {
  dispatch({
    type: EXPERIMENTS_LOADING,
  });

  const url = `/v1/projects/${projectUuid}/experiments`;
  try {
    const response = await fetchAPI(url);
    const data = await response.json();
    throwIfRequestFailed(response, data, endUserMessages.ERROR_FETCHING_EXPERIMENTS);

    dispatch({
      type: EXPERIMENTS_LOADED,
      payload: {
        experiments: data,
      },
    });
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.CONNECTION_ERROR;
    }
    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: message,
      },
    });

    pushNotificationMessage('error', message);
  }
};

export default loadExperiments;
