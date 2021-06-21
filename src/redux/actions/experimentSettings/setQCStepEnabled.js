import { EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED } from '../../actionTypes/experimentSettings';

const setQCStepEnabled = (step, configChange) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED,
    payload: { step, configChange },
  });
};

export default setQCStepEnabled;
