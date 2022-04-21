import handleError from 'utils/http/handleError';
import fetchAPI from 'utils/http/fetchAPI';
import config from 'config';
import { api } from 'utils/constants';
import endUserMessages from 'utils/endUserMessages';
import {
  EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
} from 'redux/actionTypes/experimentSettings';

const loadProcessingSettings = (experimentId) => async (dispatch) => {
  let url;
  if (config.currentApiVersion === api.V1) {
    url = `/v1/experiments/${experimentId}/processingConfig`;
  } else if (config.currentApiVersion === api.V2) {
    url = `/v2/experiments/${experimentId}/processingConfig`;
  }

  try {
    const data = await fetchAPI(url);

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
      payload: {
        data: data.processingConfig || data,
      },
    });

    return;
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_FETCHING_DATA_PROCESSING_SETTINGS);

    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_ERROR,
      payload: {
        error: errorMessage,
      },
    });
  }
};

export default loadProcessingSettings;
