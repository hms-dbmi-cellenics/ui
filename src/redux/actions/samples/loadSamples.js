import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

import {
  SAMPLES_LOADED,
  SAMPLES_ERROR,
  SAMPLES_LOADING,
} from 'redux/actionTypes/samples';

const loadSamples = (
  experimentId = null, projectUuid = null,
) => async (dispatch) => {
  const url = experimentId ? `/v1/experiments/${experimentId}/samples` : `/v1/projects/${projectUuid}/samples`;
  try {
    dispatch({
      type: SAMPLES_LOADING,
    });

    const data = await fetchAPI(url);

    let samples;

    // Querying using experimentId returns an object with a `samples` key
    if (experimentId) samples = data;

    // Querying using projectUuid returns an array with oh objects with of `samples` key
    // Data[0] because 1 project contains only 1 experiment right now.
    // This has to be changed when we support multiple experiments per project.
    if (projectUuid) [{ samples }] = data;

    // throwIfRequestFailed(response, data, endUserMessages.ERROR_FETCHING_SAMPLES);

    dispatch({
      type: SAMPLES_LOADED,
      payload: {
        samples,
      },
    });
  } catch (e) {
    // TODO we were not raising notifications here, validate whether raising or not now is ok
    const errorMessage = handleError(e);

    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default loadSamples;
