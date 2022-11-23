import {
  SAMPLES_VALIDATING_UPDATED,
} from 'redux/actionTypes/samples';

const updateSamplesValidating = (
  validating,
) => async (dispatch) => {
  dispatch({
    type: SAMPLES_VALIDATING_UPDATED,
    payload: { validating },
  });
};

export default updateSamplesValidating;
