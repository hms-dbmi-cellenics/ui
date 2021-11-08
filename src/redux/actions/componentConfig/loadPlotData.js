import { initialComponentConfigStates } from 'redux/reducers/componentConfig/initialState';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { PLOT_DATA_LOADED, PLOT_DATA_LOADING } from 'redux/actionTypes/componentConfig';

import pushNotificationMessage from 'utils/pushNotificationMessage';
import endUserMessages from 'utils/endUserMessages';
import generatePlotWorkBody from 'utils/work/generatePlotWorkBody';
import { fetchWork } from 'utils/work/fetchWork';

const loadPlotData = (experimentId, plotUuid, plotType) => async (dispatch, getState) => {
  let config = getState().componentConfig[plotUuid]?.config;

  if (!config) {
    config = initialComponentConfigStates[plotType];
  }

  const timeout = getTimeoutForWorkerTask(getState(), plotType);

  try {
    const body = generatePlotWorkBody(plotType, config);

    dispatch({
      type: PLOT_DATA_LOADING,
      payload: { plotUuid },
    });

    const data = await fetchWork(
      experimentId, body, getState, { timeout },
    );

    dispatch({
      type: PLOT_DATA_LOADED,
      payload: {
        plotUuid,
        plotData: data,
      },
    });
  } catch (error) {
    pushNotificationMessage('error', endUserMessages.ERROR_FETCHING_PLOT_DATA);
  }
};

export default loadPlotData;
