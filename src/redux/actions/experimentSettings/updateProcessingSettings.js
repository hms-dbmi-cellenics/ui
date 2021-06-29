import { EXPERIMENT_SETTINGS_PROCESSING_UPDATE, EXPERIMENT_SETTINGS_ADD_CHANGED_QC_FILTER } from '../../actionTypes/experimentSettings';

const updateProcessingSettings = (step, configChange, isUserChange = false) => (dispatch) => {
  if (isUserChange) {
    dispatch({
      type: EXPERIMENT_SETTINGS_ADD_CHANGED_QC_FILTER,
      payload: { stepKey: step },
    });
  }

  dispatch({
    type: EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
    payload: { step, configChange },
  });
};

export default updateProcessingSettings;
