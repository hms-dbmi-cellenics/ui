/* eslint-disable no-param-reassign */
import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import {
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SAVED,
} from '../../actionTypes/experiments';

// There are some differences between the property naming of elements
// stored in the ui and in the api,
// this is an attempt to deal with this in one single place (the ui)
// We should try to converge to one single model to follow
const convertedToApiModel = (experiment) => {
  const {
    id, name, projectUuid, ...restOfExperiment
  } = experiment;

  const convertedExperiment = {
    ...restOfExperiment,
    experimentId: id,
    experimentName: name,
    projectId: projectUuid,
  };

  return convertedExperiment;
};

const saveExperiment = (
  experimentId,
  newExperiment,
  alreadyExists = true,
) => async (dispatch, getState) => {
  const experimentToSend = newExperiment || getState().experiments[experimentId];

  dispatch({
    type: EXPERIMENTS_SAVING,
  });

  const url = `/v1/experiments/${experimentId}`;
  try {
    const response = await fetchAPI(
      url,
      {
        method: alreadyExists ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(convertedToApiModel(experimentToSend)),
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
};

export default saveExperiment;
