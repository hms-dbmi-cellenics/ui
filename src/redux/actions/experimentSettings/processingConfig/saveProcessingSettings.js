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
  console.log('*** just dispatched saveProcessingSettings ');
  const content = getState().experimentSettings.processing[settingName];
  console.log('*** just dispatched saveProcessingSettings 2');
  const url = `/v1/experiments/${experimentId}/processingConfig`;
  try {
    console.log('*** just dispatched saveProcessingSettings 3');
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

    console.log('*** just dispatched saveProcessingSettings 4');

    const json = await response.json();
    throwIfRequestFailed(response, json, endUserMessages.ERROR_SAVING);
    // dispatch({
    //   type: EXPERIMENT_SETTINGS_PROCESSING_SAVE,
    //   payload:
    //     { experimentId, settingName },
    // });
    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_ERROR,
      payload: {
        error: 'a very fake error',
        errorType: errorTypes.SAVE_PROCESSING_SETTINGS,
      },
    });
  } catch (e) {
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${e.message}`);
    }
    pushNotificationMessage(
      'error',
      endUserMessages.ERROR_SAVING,
    );
    console.log('*** just dispatched saveProcessingSettings 5');
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
