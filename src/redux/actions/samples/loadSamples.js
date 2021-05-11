import fetchAPI from '../../../utils/fetchAPI';
import {
  SAMPLES_LOADED,
  SAMPLES_ERROR,
} from '../../actionTypes/samples';

const loadSamples = (
  experimentId,
) => async (dispatch) => {
  try {
    const response = await fetchAPI(`/v1/experiments/${experimentId}/samples`);
    const json = await response.json();
    if (!response.ok) {
      throw new Error('HTTP status code was not 200.');
    }
    dispatch({
      type: SAMPLES_LOADED,
      payload: {
        samples: json.samples,
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
