import _ from 'lodash';

import config from 'config';
import { api } from 'utils/constants';

import fetchAPI from 'utils/fetchAPI';
import {
  EXPERIMENTS_UPDATED, EXPERIMENTS_SAVING, EXPERIMENTS_SAVED, EXPERIMENTS_ERROR,
} from 'redux/actionTypes/experiments';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { isServerError, throwIfRequestFailed } from 'utils/fetchErrors';

const convertToApiModel = (experiment) => {
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
  dispatch({
    type: EXPERIMENTS_SAVING,
  });

  let url;
  try {
    if (config.currentApiVersion === api.V1) {
      url = `/v1/experiments/${experimentId}`;

      const response = await fetchAPI(
        url,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(convertToApiModel(experimentDiff)),
        },
      );

      const json = await response.json();
      throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);
    } else if (config.currentApiVersion === api.V2) {
      url = `/v2/experiments/${experimentId}`;

      if (!_.isUndefined(experimentDiff.sampleIds)) {
        // IMPLEMENT SAMPLE REORDERING
        // experimentDiff.samplesOrder = _.clone(experimentDiff.sampleIds);
        return;
      }

      console.log();

      const response = await fetchAPI(
        url,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(experimentDiff),
        },
      );

      const json = await response.json();
      throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);
    }

    dispatch({
      type: EXPERIMENTS_UPDATED,
      payload: {
        experimentId,
        experiment: experimentDiff,
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
};

export default updateExperiment;
