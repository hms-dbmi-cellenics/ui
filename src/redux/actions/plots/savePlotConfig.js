import { SAVE_PLOT_CONFIG } from '../../actionTypes/plots';
import getApiEndpoint from '../../../utils/apiEndpoint';

const savePlotConfig = (experimentId, plotUuid) => async (dispatch, getState) => {
  const content = getState().plots[plotUuid];

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
    type: SAVE_PLOT_CONFIG,
    payload:
      { plotUuid, lastUpdated },
  });
};

export default savePlotConfig;
