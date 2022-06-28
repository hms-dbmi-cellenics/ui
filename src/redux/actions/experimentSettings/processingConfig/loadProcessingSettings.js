import {
  EXPERIMENT_SETTINGS_PROCESSING_CONFIG_LOADED,
  EXPERIMENT_SETTINGS_PROCESSING_ERROR,
} from 'redux/actionTypes/experimentSettings';

import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const loadProcessingSettings = (experimentId) => async (dispatch) => {
  try {
    const data = await fetchAPI(`/v2/experiments/${experimentId}/processingConfig`);

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
