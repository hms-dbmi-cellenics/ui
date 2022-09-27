import _ from 'lodash';
import fetchAPI from 'utils/http/fetchAPI';
import endUserMessages from 'utils/endUserMessages';
import { LOAD_CONFIG } from 'redux/actionTypes/componentConfig';
import { initialComponentConfigStates, initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import handleError from 'utils/http/handleError';
import httpStatusCodes from 'utils/http/httpStatusCodes';

const loadConditionalComponentConfig = (
  experimentId, componentUuid, type, skipAPI, customConfig = {},
) => async (dispatch) => {
  const defaultConfig = initialPlotConfigStates[type] ?? initialComponentConfigStates[type];
  const configToUse = _.merge({}, defaultConfig, customConfig);

  const dispatchLoad = (config) => {
    dispatch({
      type: LOAD_CONFIG,
      payload: {
        experimentId,
        plotUuid: componentUuid,
        plotType: type,
        plotData: [],
        config,
      },
    });
  };

  if (skipAPI) {
    dispatchLoad(configToUse);
    return;
  }

  try {
    const data = await fetchAPI(`/v2/experiments/${experimentId}/plots/${componentUuid}`);

    const plotConfig = _.merge({}, configToUse, data.config);
    dispatchLoad(plotConfig);
  } catch (e) {
    // load default plot config if it not found
    if (e.statusCode === httpStatusCodes.NOT_FOUND) {
      dispatchLoad(configToUse);
      return;
    }

    handleError(e, endUserMessages.ERROR_FETCHING_PLOT_CONFIG);
  }
};

export default loadConditionalComponentConfig;
