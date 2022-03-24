import { EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED } from 'redux/actionTypes/experimentSettings';

const setQCStepEnabled = (step, enabled) => (dispatch) => {
  console.log('***** inside action setQCStepEnabled 1');
  dispatch({
    type: EXPERIMENT_SETTINGS_SET_QC_STEP_ENABLED,
    payload: { step, enabled },
  });
  console.log('***** inside action setQCStepEnabled 2');
};

export default setQCStepEnabled;
