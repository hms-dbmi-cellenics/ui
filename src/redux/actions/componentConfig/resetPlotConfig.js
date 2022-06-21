import { RESET_CONFIG, SAVE_CONFIG } from 'redux/actionTypes/componentConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

import config from 'config';
import { api } from 'utils/constants';

const resetPlotConfig = (experimentId, plotUuid, plotType) => async (dispatch) => {
  const defaultConfig = initialPlotConfigStates[plotType];

  let url;

  if (config.currentApiVersion === api.V1) {
    url = `/v1/experiments/${experimentId}/plots-tables/${plotUuid}`;
  } else if (config.currentApiVersion === api.V2) {
    url = `/v2/experiments/${experimentId}/plots/${plotUuid}`;
  }

  try {
    await fetchAPI(
      url,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config: defaultConfig }),
      },
    );

    dispatch({
      type: RESET_CONFIG,
      payload: {
        plotUuid,
        config: defaultConfig,
      },
    });
  } catch (e) {
    handleError(e, endUserMessages.ERROR_SAVING_PLOT_CONFIG);

    dispatch({
      type: SAVE_CONFIG,
      payload:
        { plotUuid, success: false },
    });
  }
};

export default resetPlotConfig;
