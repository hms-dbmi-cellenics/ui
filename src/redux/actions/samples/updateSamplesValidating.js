import {
  SAMPLES_VALIDATING_UPDATED,
} from 'redux/actionTypes/samples';

const updateSamplesValidating = (experimentId, validating) => async (dispatch) => {
  dispatch({
    type: SAMPLES_VALIDATING_UPDATED,
    payload: { experimentId, validating },
  });
};

export default updateSamplesValidating;
