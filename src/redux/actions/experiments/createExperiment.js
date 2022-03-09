/* eslint-disable no-param-reassign */
import fetchAPI from 'utils/fetchAPI';
import moment from 'moment';
import hash from 'object-hash';

import { api } from 'utils/constants';

import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SAVED,
} from 'redux/actionTypes/experiments';
import { experimentTemplate } from 'redux/reducers/experiments/initialState';

import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { isServerError, throwIfRequestFailed } from 'utils/fetchErrors';
import experimentConvertedToApiModel from 'utils/convertExperimentToApiModel';

const createExperiment = (
  projectUuid, newExperimentName,
) => async (dispatch, getState) => {
  const createdDate = moment().toISOString();

  const experimentId = hash.MD5(createdDate);

  const newExperiment = {
    ...experimentTemplate,
    id: experimentId,
    name: newExperimentName,
    projectUuid,
    createdDate,
  };

  let url;
  let experimentToSend;

  try {
    if (api.CURRENT_VERSION === api.possibleVersions.V1) {
      experimentToSend = newExperiment || getState().experiments[experimentId];
      experimentToSend = experimentConvertedToApiModel(experimentToSend);

      dispatch({
        type: EXPERIMENTS_SAVING,
      });

      url = `/v1/experiments/${experimentId}`;
    } else if (api.CURRENT_VERSION === api.possibleVersions.V2) {
      const { id, name, description } = newExperiment || getState().experiments[experimentId];
      experimentToSend = { id, name, description };

      url = `/v2/experiments/${experimentId}`;
    }

    dispatch({
      type: EXPERIMENTS_SAVING,
    });

    try {
      const response = await fetchAPI(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(experimentToSend),
        },
      );

      const json = await response.json();
      throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);

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

    dispatch({
      type: EXPERIMENTS_CREATED,
      payload: {
        experiment: newExperiment,
      },
    });
  } catch (e) {
    pushNotificationMessage('error', endUserMessages.ERROR_SAVING);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: endUserMessages.ERROR_SAVING,
      },
    });
  }

  return Promise.resolve(newExperiment);
};

export default createExperiment;
