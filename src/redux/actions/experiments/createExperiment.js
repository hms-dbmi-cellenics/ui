/* eslint-disable no-param-reassign */
import fetchAPI from 'utils/http/fetchAPI';
import moment from 'moment';
import hash from 'object-hash';

import config from 'config';
import { api } from 'utils/constants';

import {
  EXPERIMENTS_CREATED,
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
} from 'redux/actionTypes/experiments';
import { experimentTemplate } from 'redux/reducers/experiments/initialState';

import endUserMessages from 'utils/endUserMessages';
import convertExperimentToApiV1Model from 'utils/convertExperimentToApiV1Model';
import handleError from 'utils/http/handleError';

const createExperiment = (
  projectUuid, newExperimentName,
) => async (dispatch) => {
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

  if (config.currentApiVersion === api.V1) {
    experimentToSend = convertExperimentToApiV1Model(newExperiment);

    url = `/v1/experiments/${experimentId}`;
  } else if (config.currentApiVersion === api.V2) {
    const { id, name, description } = newExperiment;
    experimentToSend = { id, name, description };

    url = `/v2/experiments/${experimentId}`;
  }

  dispatch({
    type: EXPERIMENTS_SAVING,
  });

  try {
    await fetchAPI(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experimentToSend),
      },
    );

    dispatch({
      type: EXPERIMENTS_CREATED,
      payload: {
        experiment: newExperiment,
      },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_SAVING);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }

  return Promise.resolve(newExperiment);
};

export default createExperiment;
