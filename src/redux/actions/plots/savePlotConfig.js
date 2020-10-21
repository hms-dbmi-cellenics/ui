import { SAVE_PLOT_CONFIG } from '../../actionTypes/plots';
import getApiEndpoint from '../../../utils/apiEndpoint';

const savePlotConfig = (experimentId, plotUuid) => async (dispatch, getState) => {
  // Do not save the 'outstandingChanges' state to the database.
  const { outstandingChanges, ...content } = getState().plots[plotUuid];

  const response = await fetch(
    `${getApiEndpoint()}/v1/experiments/${experimentId}/plots-tables/${plotUuid}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    },
  );
  const date = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();

  // eslint-disable-next-line prefer-template
  const lastUpdated = day + ' ' + month + ' ' + year + ' ' + hour + ':' + minute;
  //const { lastUpdated } = await response.json();

  console.log('RESPONSE ', response.json());
  dispatch({
    type: SAVE_PLOT_CONFIG,
    payload:
      { plotUuid, lastUpdated },
  });
};

export default savePlotConfig;
