import {
  EXPERIMENT_SETTINGS_PROCESSING_SAVE,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
} from 'redux/actionTypes/experimentSettings';
import config from 'config';
import { api } from 'utils/constants';
import endUserMessages from 'utils/endUserMessages';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import errorTypes from '../errorTypes';

const saveProcessingSettings = (experimentId, settingName) => async (dispatch, getState) => {
  const content = getState().experimentSettings.processing[settingName];

  let url;
  if (config.currentApiVersion === api.V1) {
    url = `/v1/experiments/${experimentId}/processingConfig`;
  } else if (config.currentApiVersion === api.V2) {
    url = `/v2/experiments/${experimentId}/processingConfig`;
  }

  try {
    await fetchAPI(
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

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_SAVE,
      payload:
        { experimentId, settingName },
    });
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_SAVING);

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_ERROR,
      payload: {
        error: errorMessage,
        errorType: errorTypes.SAVE_PROCESSING_SETTINGS,
      },
    });
  }
};

export default saveProcessingSettings;
