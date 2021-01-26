import { EXPERIMENT_SETTINGS_PROCESSING_SAVE } from '../../actionTypes/experimentSettings';
import getApiEndpoint from '../../../utils/apiEndpoint';

const saveProcessingSettings = (experimentId, settingName) => async (dispatch, getState) => {
  const content = getState().experimentSettings.processing[settingName];

  const response = await fetch(
    `${getApiEndpoint()}/v1/experiments/${experimentId}/processingConfig`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{
        name: settingName,
        body: content,
      }]),
    },
  );

  console.log(response);

  dispatch({
    type: EXPERIMENT_SETTINGS_PROCESSING_SAVE,
    payload:
      { experimentId, settingName },
  });
};

export default saveProcessingSettings;
