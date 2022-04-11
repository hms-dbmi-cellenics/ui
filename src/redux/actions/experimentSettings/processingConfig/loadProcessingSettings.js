import config from 'config';
import { api } from 'utils/constants';
import fetchAPI from '../../../../utils/fetchAPI';
import {
  EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
} from '../../../actionTypes/experimentSettings';

import { isServerError, throwIfRequestFailed } from '../../../../utils/fetchErrors';
import endUserMessages from '../../../../utils/endUserMessages';
import pushNotificationMessage from '../../../../utils/pushNotificationMessage';
import errorTypes from '../errorTypes';

const loadProcessingSettings = (experimentId) => async (dispatch) => {
  let url;
  if (config.currentApiVersion === api.V1) {
    url = `/v1/experiments/${experimentId}/processingConfig`;
  } else if (config.currentApiVersion === api.V2) {
    url = `/v2/experiments/${experimentId}/processingConfig`;
  }

  try {
    const response = await fetchAPI(url);

    const data = await response.json();

    throwIfRequestFailed(response, data, endUserMessages.ERROR_FETCHING_PROCESSING);

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
      payload: {
        data: data.processingConfig,
      },
    });

    return;
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.CONNECTION_ERROR;
    }
    pushNotificationMessage(
      'error',
      message,
    );

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_ERROR,
      payload: {
        error: message,
        errorType: errorTypes.LOADING_PROCESSING_SETTINGS,
      },
    });
  }
};

export default loadProcessingSettings;
