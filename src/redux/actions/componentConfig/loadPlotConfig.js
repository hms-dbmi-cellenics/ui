import _ from 'lodash';
import fetchAPI from 'utils/fetchAPI';
import { isServerError, throwIfRequestFailed } from 'utils/fetchErrors';
import endUserMessages from 'utils/endUserMessages';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import { LOAD_CONFIG } from 'redux/actionTypes/componentConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';

const loadPlotConfig = (experimentId, plotUuid, plotType) => async (dispatch) => {
  const url = `/v1/experiments/${experimentId}/plots-tables/${plotUuid}`;
  try {
    const response = await fetchAPI(url);

    if (response.ok) {
      const data = await response.json();

      const config = _.merge({}, initialPlotConfigStates[plotType], data.config);
      dispatch({
        type: LOAD_CONFIG,
        payload: {
          experimentId,
          plotUuid,
          plotType,
          plotData: data.plotData,
          config,
        },
      });
    } else if (response.status === 404) {
      dispatch({
        type: LOAD_CONFIG,
        payload: {
          experimentId,
          plotUuid,
          plotType,
          plotData: [],
          config: _.cloneDeep(initialPlotConfigStates[plotType]),
        },
      });
    } else {
      const data = await response.json();
      throwIfRequestFailed(response, data, endUserMessages.ERROR_FETCHING_PLOT_CONFIG);
    }
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.CONNECTION_ERROR;
    }
    pushNotificationMessage('error', message);
  }
};

export default loadPlotConfig;
