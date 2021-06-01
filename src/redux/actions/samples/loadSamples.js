import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwWithEndUserMessage } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import {
  SAMPLES_LOADED,
  SAMPLES_ERROR,
  SAMPLES_LOADING,
} from '../../actionTypes/samples';

const loadSamples = (
  experimentId = false, projectUuid = false,
) => async (dispatch) => {
  const url = experimentId ? `/v1/experiments/${experimentId}/samples` : `/v1/projects/${projectUuid}/samples`;
  try {
    dispatch({
      type: SAMPLES_LOADING,
    });
    const response = await fetchAPI(url);
    const data = await response.json();

    throwWithEndUserMessage(response, data, endUserMessages.errorFetchingSamples);

    dispatch({
      type: SAMPLES_LOADED,
      payload: {
        // Data[0] because 1 project contains only 1 experiment right now.
        // This has to be changed when we support multiple experiments per project.
        samples: data[0].samples,
      },
    });
  } catch (e) {
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${e.message}`);
    }
    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: e,
      },
    });
  }
};

export default loadSamples;
