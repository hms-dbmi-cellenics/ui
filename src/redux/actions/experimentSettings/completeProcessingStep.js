import { EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP } from '../../actionTypes/experimentSettings';

import getApiEndpoint from '../../../utils/apiEndpoint';

const completeProcessingStep = (
  experimentId,
  settingName,
  numSteps,
) => async (dispatch, getState) => {
  const { stepsDone } = getState().experimentSettings.processing.processingConfig;

  const arrayStepsDone = Array.from(stepsDone);

  arrayStepsDone.push(settingName);

  const body = {
    complete: arrayStepsDone.size === numSteps,
    stepsDone: arrayStepsDone,
  };

  await fetch(
    `${getApiEndpoint()}/v1/experiments/${experimentId}/processingConfig`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        name: 'processingConfig',
        body,
      }]),
    },
  );

  dispatch({
    type: EXPERIMENT_SETTINGS_PROCESSING_COMPLETE_STEP,
    payload:
      { experimentId, settingName, numSteps },
  });
};

export default completeProcessingStep;
