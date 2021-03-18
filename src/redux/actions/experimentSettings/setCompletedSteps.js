import {
  EXPERIMENT_SETTINGS_SET_COMPLETED_STEPS,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
} from '../../actionTypes/experimentSettings';

import getApiEndpoint from '../../../utils/apiEndpoint';

import errorTypes from './errorTypes';

import pushNotificationMessage from '../pushNotificationMessage';

const setCompletedSteps = (
  experimentId,
  stepsDone,
  numSteps,
) => async (dispatch, getState) => {
  const { completingStepError } = getState().experimentSettings.processing.meta;

  const arrayStepsDone = Array.from(stepsDone);

  const body = {
    complete: arrayStepsDone.size === numSteps,
    stepsDone: arrayStepsDone,
  };

  try {
    const response = await fetch(
      `${getApiEndpoint()}/v1/experiments/${experimentId}/processingConfig`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          name: 'meta',
          body,
        }]),
      },
    );

    if (!response.ok) {
      throw new Error('HTTP status code was not 200.');
    }

    // If we had previously shown an error message, then now show a success one
    if (completingStepError) {
      dispatch(
        pushNotificationMessage(
          'success',
          'Progress saved!',
          3,
        ),
      );
    }

    dispatch({
      type: EXPERIMENT_SETTINGS_SET_COMPLETED_STEPS,
      payload:
        { experimentId, completedSteps: arrayStepsDone, numSteps },
    });
  } catch (e) {
    dispatch(
      pushNotificationMessage(
        'error',
        'We couldn\'t save your processing settings. Please check your internet connection and try again.',
        3,
      ),
    );

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_ERROR,
      payload: { error: 'Error persisting state of currently completed steps', errorType: errorTypes.COMPLETING_PROCESSING_STEP },
    });
  }
};

export default setCompletedSteps;
