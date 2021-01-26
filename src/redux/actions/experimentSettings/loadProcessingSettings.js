import { EXPERIMENT_SETTINGS_PROCESSING_LOAD, EXPERIMENT_SETTINGS_PROCESSING_ERROR } from '../../actionTypes/experimentSettings';

import getApiEndpoint from '../../../utils/apiEndpoint';

const loadProcessingSettings = (experimentId) => async (dispatch) => {
  try {
    const response = await fetch(
      `${getApiEndpoint()}/v1/experiments/${experimentId}/processingConfig`,
    );

    if (response.ok) {
      const data = await response.json();

      dispatch({
        type: EXPERIMENT_SETTINGS_PROCESSING_LOAD,
        payload: { data: data.processingConfig },
      });

      return;
    }

    throw new Error('HTTP status code was not 200.');
  } catch (e) {
    dispatch({
      type: EXPERIMENT_SETTINGS_PROCESSING_ERROR,
      payload: {},
    });
  }
};

export default loadProcessingSettings;
