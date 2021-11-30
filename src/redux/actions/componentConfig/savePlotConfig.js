import fetchAPI from '../../../utils/fetchAPI';
import { SAVE_CONFIG } from '../../actionTypes/componentConfig';

const savePlotConfig = (experimentId, plotUuid) => async (dispatch, getState) => {
  // Do not save the 'outstandingChanges' state to the database.
  // Do not save the 'plotData' state to the database because it is not managed by the UI.
  // Do not save loading and error as it they are states in the UI.
  const {
    outstandingChanges,
    plotData,
    loading,
    error,
    ...content
  } = getState().componentConfig[plotUuid];

  const response = await fetchAPI(
    `/v1/experiments/${experimentId}/plots-tables/${plotUuid}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
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
