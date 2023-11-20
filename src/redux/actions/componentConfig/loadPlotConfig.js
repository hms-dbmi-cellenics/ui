import _ from 'lodash';
import fetchAPI from 'utils/http/fetchAPI';
import endUserMessages from 'utils/endUserMessages';
import { LOAD_CONFIG } from 'redux/actionTypes/componentConfig';
import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import handleError from 'utils/http/handleError';
import httpStatusCodes from 'utils/http/httpStatusCodes';

const loadPlotConfig = (experimentId, plotUuid, plotType) => async (dispatch) => {
  try {
    const data = await fetchAPI(`/v2/experiments/${experimentId}/plots/${plotUuid}`);

    const plotConfig = _.merge({}, initialPlotConfigStates[plotType], data.config);
    dispatch({
      type: LOAD_CONFIG,
      payload: {
        experimentId,
        plotUuid,
        plotType,
        plotData: data.plotData,
        config: plotConfig,
      },
    });
  } catch (e) {
    // load default plot config if it not found
    if (e.statusCode === httpStatusCodes.NOT_FOUND) {
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
      return;
    }

    handleError(e, endUserMessages.ERROR_FETCHING_PLOT_CONFIG);
  }
};

export default loadPlotConfig;
