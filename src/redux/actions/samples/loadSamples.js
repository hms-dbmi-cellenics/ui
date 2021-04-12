import fetch from 'better-fetch';
import getApiEndpoint from '../../../utils/apiEndpoint';
import {
  SAMPLES_LOADED,
  SAMPLES_ERROR,
} from '../../actionTypes/samples';

const loadSamples = (
  experimentId,
) => async (dispatch) => {
  try {
    const response = await fetch(`${getApiEndpoint()}/v1/experiments/${experimentId}/samples`);
    const json = await response.json();
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
