import fetchAPI from '../../../utils/fetchAPI';
import {
  SAMPLES_LOADED,
  SAMPLES_ERROR,
} from '../../actionTypes/samples';

const loadSamples = (
  experimentId = false, projectUuid = false,
) => async (dispatch) => {
  try {
    let response = false;

    if (experimentId) {
      response = await fetchAPI(`/v1/experiments/${experimentId}/samples`);
    } else {
      response = await fetchAPI(`/v1/projects/${projectUuid}/samples`, {
        method: 'GET',
      });
    }
    const json = await response.json();
    if (!response.ok) {
      throw new Error('HTTP status code was not 200.');
    }
    dispatch({
      type: SAMPLES_LOADED,
      payload: {
        samples: json,
      },
    });
  } catch (e) {
    dispatch({
      type: SAMPLES_ERROR,
      payload: {
        error: e,
      },
    });
  }
};

export default loadSamples;
