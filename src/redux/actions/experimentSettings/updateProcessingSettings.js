import { EXPERIMENT_SETTINGS_PROCESSING_UPDATE } from '../../actionTypes/experimentSettings';

const updateProcessingSettings = (step, configChange) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
    payload: { step, configChange },
  });
};

export default updateProcessingSettings;
