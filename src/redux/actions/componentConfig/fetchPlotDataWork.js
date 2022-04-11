import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import generatePlotWorkBody from 'utils/work/generatePlotWorkBody';
import { fetchWork } from 'utils/work/fetchWork';

const fetchPlotDataWork = (experimentId, plotUuid, plotType) => async (dispatch, getState) => {
  const config = getState().componentConfig[plotUuid]?.config ?? initialPlotConfigStates[plotType];
  const timeout = getTimeoutForWorkerTask(getState(), 'PlotData');

  try {
    const body = generatePlotWorkBody(plotType, config);

    dispatch({
      type: PLOT_DATA_LOADING,
      payload: { plotUuid },
    });

    console.log('fetching work lcs');
    const data = await fetchWork(
      experimentId, body, getState, { timeout },
    );
    console.log('work fetched lcs');
    console.log('data lcs', data);

    dispatch({
      type: PLOT_DATA_LOADED,
      payload: {
        plotUuid,
        plotData: data,
      },
    });
  } catch (e) {
    console.log('error lcs', e);
    const errorMessage = handleError(e, endUserMessages.ERROR_FETCHING_PLOT_DATA);
    console.log('errorMessage lcs', errorMessage);

    dispatch({
      type: PLOT_DATA_ERROR,
      payload: {
        plotUuid,
        error: errorMessage,
      },
    });
  }
};

export default fetchPlotDataWork;
