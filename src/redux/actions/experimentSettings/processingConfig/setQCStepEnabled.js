import { EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED } from '../../../actionTypes/experimentSettings';

const setQCStepEnabled = (step, enabled) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED,
    payload: { step, enabled },
  });
};

export default setQCStepEnabled;
