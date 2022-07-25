import { RESET_CONFIG, SAVE_CONFIG } from 'redux/actionTypes/componentConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import fetchAPI from 'utils/http/fetchAPI';
import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';

const resetPlotConfig = (experimentId, plotUuid, plotType) => async (dispatch) => {
  const defaultConfig = initialPlotConfigStates[plotType];

  try {
    await fetchAPI(
      `/v2/experiments/${experimentId}/plots/${plotUuid}`,
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
