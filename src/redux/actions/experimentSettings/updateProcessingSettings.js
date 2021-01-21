import { EXPERIMENT_SETTINGS_PROCESSING_UPDATE } from '../../actionTypes/experimentSettings';

const updateProcessingSettings = (experimentId, settingName, configChange) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_PROCESSING_UPDATE,
    payload:
      { experimentId, settingName, configChange },
  });
};

export default updateProcessingSettings;
