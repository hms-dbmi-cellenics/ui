import {
  EXPERIMENT_SETTINGS_PROCESSING_SAVE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
} from 'redux/actionTypes/experimentSettings';

import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';

const saveProcessingSettings = (experimentId, settingName) => async (dispatch, getState) => {
  const content = getState().experimentSettings.processing[settingName];

  const url = `/v1/experiments/${experimentId}/processingConfig`;
  try {
    const res = await fetchAPI(
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
      // false,
    );

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_SAVE,
      payload:
        { experimentId, settingName },
    });
    return res;
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_SAVING);

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_ERROR,
      payload: {
        error: errorMessage,
      },
    });

    // throw e;
    Promise.reject(errorMessage);
  }
};

export default saveProcessingSettings;
