import _ from 'lodash';
import fetchAPI from 'utils/http/fetchAPI';
import endUserMessages from 'utils/endUserMessages';
import { LOAD_CONFIG } from 'redux/actionTypes/componentConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import handleError from 'utils/http/handleError';
import httpStatusCodes from 'utils/http/httpStatusCodes';

const loadPlotConfig = (
  experimentId,
  plotUuid,
  plotType,
  beforeLoadConfigHook,
) => async (dispatch) => {
  try {
    const { config, plotData } = await fetchAPI(`/v2/experiments/${experimentId}/plots/${plotUuid}`);

    let plotConfig = _.merge({}, initialPlotConfigStates[plotType], config);
    plotConfig = beforeLoadConfigHook ? beforeLoadConfigHook(plotConfig) : plotConfig;

    dispatch({
      type: LOAD_CONFIG,
      payload: {
        experimentId,
        plotUuid,
        plotType,
        plotData,
        config: plotConfig,
      },
    });
  } catch (e) {
    // load default plot config if it not found
    if (e.statusCode === httpStatusCodes.NOT_FOUND) {
      let plotConfig = _.cloneDeep(initialPlotConfigStates[plotType]);
      if (beforeLoadConfigHook) plotConfig = beforeLoadConfigHook(plotConfig);

      dispatch({
        type: LOAD_CONFIG,
        payload: {
          experimentId,
          plotUuid,
          plotType,
          plotData: [],
          config: plotConfig,
        },
      });
      return;
    }

    handleError(e, endUserMessages.ERROR_FETCHING_PLOT_CONFIG);
  }
};

export default loadPlotConfig;
