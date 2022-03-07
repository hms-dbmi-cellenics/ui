import _ from 'lodash';

import fetchAPI from 'utils/fetchAPI';
import {
  EXPERIMENTS_UPDATED, EXPERIMENTS_SAVING, EXPERIMENTS_SAVED, EXPERIMENTS_ERROR,
} from 'redux/actionTypes/experiments';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';

const convertedToApiModel = (experiment) => {
  const {
    id = null, name = null, projectUuid = null, ...restOfExperiment
  } = experiment;

  const convertedExperiment = {
    ...restOfExperiment,
    experimentId: id,
    experimentName: name,
    projectId: projectUuid,
  };

  return _.omitBy(convertedExperiment, _.isNull);
};

const updateExperiment = (
  experimentId,
  experimentDiff,
) => async (dispatch) => {
  try {
    dispatch({
      type: EXPERIMENTS_SAVING,
    });

    const url = `/v1/experiments/${experimentId}`;
    try {
      const response = await fetchAPI(
        url,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(convertedToApiModel(experimentDiff)),
        },
      );

      const json = await response.json();
      throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);

      dispatch({
        type: EXPERIMENTS_UPDATED,
        payload: {
          experimentId,
          experimentDiff,
        },
      });

      dispatch({
        type: EXPERIMENTS_SAVED,
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

      pushNotificationMessage(
        'error',
        message,
      );
    }
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);
  }
};

export default updateExperiment;
