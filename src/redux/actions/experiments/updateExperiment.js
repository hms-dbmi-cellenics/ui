import _ from 'lodash';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import { api } from 'utils/constants';

import config from 'config';

import {
  EXPERIMENTS_UPDATED, EXPERIMENTS_SAVING, EXPERIMENTS_ERROR,
} from 'redux/actionTypes/experiments';
import endUserMessages from 'utils/endUserMessages';

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

      await fetchAPI(
        url,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(convertToApiModel(experimentDiff)),
        },
      );
    } else if (config.currentApiVersion === api.V2) {
      if (experimentDiff.sampleIds) {
        throw new Error('SampleIds in v2 shouldn\'t be updated in this action creator');
      }

      // If updating the samples, then reorderSamples should implement this
      url = `/v2/experiments/${experimentId}`;

      await fetchAPI(
        url,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(experimentDiff),
        },
      );
    }

    dispatch({
      type: EXPERIMENTS_UPDATED,
      payload: {
        experimentId,
        experiment: experimentDiff,
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
};

export default updateExperiment;
