import { EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP } from '../../actionTypes/experimentSettings';

const completeProcessingStep = (experimentId, settingName, numSteps) => (dispatch) => {
  dispatch({
    type: EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP,
    payload:
      { experimentId, settingName, numSteps },
  });
};

export default completeProcessingStep;
