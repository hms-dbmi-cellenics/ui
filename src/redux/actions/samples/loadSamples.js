import fetchAPI from '../../../utils/fetchAPI';
import {
  SAMPLES_LOADED,
  SAMPLES_ERROR,
  SAMPLES_LOADING,
} from '../../actionTypes/samples';

const loadSamples = (
  experimentId = false, projectUuid = false,
) => async (dispatch) => {
  try {
    let response = false;
    dispatch({
      type: SAMPLES_LOADING,
    });
    if (experimentId) {
      response = await fetchAPI(`/v1/experiments/${experimentId}/samples`);
    } else {
      response = await fetchAPI(`/v1/projects/${projectUuid}/samples`, {
        method: 'GET',
      });
    }
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }
    dispatch({
      type: SAMPLES_LOADED,
      payload: {
        // Data[0] because 1 project contains only 1 experiment right now.
        // This has to be changed when we support multiple experiments per project.
        samples: data[0].samples,
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
