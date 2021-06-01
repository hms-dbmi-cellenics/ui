import _ from 'lodash';
import fetchAPI from '../../../utils/fetchAPI';
import { isServerError, throwWithEndUserMessage } from '../../../utils/fetchErrors';
import endUserMessages from '../../../utils/endUserMessages';
import pushNotificationMessage from '../../../utils/pushNotificationMessage';
import { LOAD_CONFIG } from '../../actionTypes/componentConfig';
import { initialPlotConfigStates } from '../../reducers/componentConfig/initialState';

const loadPlotConfig = (experimentId, plotUuid, plotType) => async (dispatch) => {
  const url = `/v1/experiments/${experimentId}/plots-tables/${plotUuid}`;
  try {
    const response = await fetchAPI(url);
    const data = await response.json();
    if (response.ok) {
      const config = _.merge({}, initialPlotConfigStates[plotType], data.config);
      dispatch({
        type: LOAD_CONFIG,
        payload: {
          ...data,
          plotType,
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
      throwWithEndUserMessage(response, data, endUserMessages.errorFetchingPlotConfig);
    }
  } catch (e) {
    let { message } = e;
    if (!isServerError(e)) {
      console.error(`fetch ${url} error ${message}`);
      message = endUserMessages.connectionError;
    }
    pushNotificationMessage('error', message);
  }
};

export default loadPlotConfig;
