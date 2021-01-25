import { EXPERIMENT_SETTINGS_PROCESSING_LOADED } from '../../actionTypes/experimentSettings';

import getApiEndpoint from '../../../utils/apiEndpoint';
import pushNotificationMessage from '../notifications';
import messages from '../../../components/notification/messages';

const loadProcessingSettings = (experimentId) => async (dispatch) => {
  try {
    const response = await fetch(
      `${getApiEndpoint()}/v1/experiments/${experimentId}/processingConfig`,
    );

    if (response.ok) {
      const data = await response.json();

      dispatch({
        type: EXPERIMENT_SETTINGS_PROCESSING_LOADED,
        payload: { data: data.processingConfig },
      });

      return;
    }

    throw new Error('HTTP status code was not 200.');
  } catch (e) {
    dispatch(pushNotificationMessage('error', messages.saveCellSets, 10));
  }
};

export default loadProcessingSettings;
