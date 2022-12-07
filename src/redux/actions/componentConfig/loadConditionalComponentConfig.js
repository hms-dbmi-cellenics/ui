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
  const dimensionsToUse = customConfig.dimensions
    ? { dimensions: customConfig.dimensions }
    : {};

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

    const plotConfig = _.merge({}, defaultConfig, data.config, dimensionsToUse);

    dispatchLoad(plotConfig);
  } catch (e) {
    // load default plot config if it not found

    // when loading multi view a different error is thrown
    // APIError: [object Object] undefined, with 404 under e.statusCode.status
    // while loading plot config for plotUuid throws
    // Not Found: 404 Not Found, with 404 under e.statusCode
    if ([e.statusCode, e.statusCode.status].includes(httpStatusCodes.NOT_FOUND)) {
      dispatchLoad(configToUse);
      return;
    }

    handleError(e, endUserMessages.ERROR_FETCHING_PLOT_CONFIG);
  }
};

export default loadConditionalComponentConfig;
