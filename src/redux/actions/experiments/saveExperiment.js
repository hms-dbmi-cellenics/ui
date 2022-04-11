import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import {
  EXPERIMENTS_ERROR,
  EXPERIMENTS_SAVING,
  EXPERIMENTS_SAVED,
} from 'redux/actionTypes/experiments';

import convertExperimentToApiV1Model from 'utils/convertExperimentToApiV1Model';

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
    await fetchAPI(
      url,
      {
        method: alreadyExists ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(convertExperimentToApiV1Model(experimentToSend)),
      },
      false,
    );

    dispatch({
      type: EXPERIMENTS_SAVED,
    });
  } catch (e) {
    const errorMessage = handleError(e);

    dispatch({
      type: EXPERIMENTS_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default saveExperiment;
