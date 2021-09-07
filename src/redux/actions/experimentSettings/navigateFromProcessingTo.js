import {
  EXPERIMENT_SETTINGS_NAVIGATE_TO,
} from '../../actionTypes/experimentSettings';

const navigateFromProcessingTo = (path) => async (dispatch) => dispatch({
  type: EXPERIMENT_SETTINGS_NAVIGATE_TO,
  payload: path,
});

export default navigateFromProcessingTo;
