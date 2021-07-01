import fetchAPI from '../../../../utils/fetchAPI';
import {
  EXPERIMENT_SETTINGS_PROCESSING_SAVE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
} from '../../../actionTypes/experimentSettings';

import { isServerError, throwIfRequestFailed } from '../../../../utils/fetchErrors';
import endUserMessages from '../../../../utils/endUserMessages';
import pushNotificationMessage from '../../../../utils/pushNotificationMessage';

import errorTypes from '../errorTypes';

const saveProcessingSettings = (experimentId, settingName) => async (dispatch, getState) => {
  const content = getState().experimentSettings.processing[settingName];

  const url = `/v1/experiments/${experimentId}/processingConfig`;
  try {
    const response = await fetchAPI(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          name: settingName,
          body: content,
        }]),
      },
    );

    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_SAVE,
      payload:
        { experimentId, settingName },
    });
  } catch (e) {
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${e.message}`);
    }
    pushNotificationMessage(
      'error',
      endUserMessages.ERROR_SAVING,
    );

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_ERROR,
      payload: {
        error: endUserMessages.ERROR_SAVING,
        errorType: errorTypes.SAVE_PROCESSING_SETTINGS,
      },
    });
  }
};

export default saveProcessingSettings;
