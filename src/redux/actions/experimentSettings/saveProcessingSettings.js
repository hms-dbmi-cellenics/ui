import fetchAPI from '../../../utils/fetchAPI';
import {
  EXPERIMENT_SETTINGS_PROCESSING_SAVE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
} from '../../actionTypes/experimentSettings';

import pushNotificationMessage from '../../../utils/pushNotificationMessage';

import errorTypes from './errorTypes';

const saveProcessingSettings = (experimentId, settingName) => async (dispatch, getState) => {
  const content = getState().experimentSettings.processing[settingName];

  try {
    const response = await fetchAPI(
      `/v1/experiments/${experimentId}/processingConfig`,
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

    if (!response.ok) {
      throw new Error('HTTP status code was not 200.');
    }

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_SAVE,
      payload:
        { experimentId, settingName },
    });
  } catch (e) {
    pushNotificationMessage(
      'error',
      'We couldn\'t connect to the server to save your current processing settings, retrying...',
    );

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_ERROR,
      payload: {
        error: "Couldn't save experiment processing settings.",
        errorType: errorTypes.SAVE_PROCESSING_SETTINGS,
      },
    });
  }
};

export default saveProcessingSettings;
