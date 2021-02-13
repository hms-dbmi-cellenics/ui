import { SAVE_CONFIG } from '../../actionTypes/componentConfig';
import getApiEndpoint from '../../../utils/apiEndpoint';

const savePlotConfig = (experimentId, plotUuid) => async (dispatch, getState) => {
  // Do not save the 'outstandingChanges' state to the database.
  console.log('SAVING!');
  const { outstandingChanges, ...content } = getState().componentConfig[plotUuid];
  // api expects the 'type' parameter, so it has to be set
  const response = await fetch(
    `${getApiEndpoint()}/v1/experiments/${experimentId}/plots-tables/${plotUuid}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    },
  );
  const { lastUpdated } = await response.json();

  dispatch({
    type: SAVE_CONFIG,
    payload:
      { plotUuid, lastUpdated },
  });
};

export default savePlotConfig;
