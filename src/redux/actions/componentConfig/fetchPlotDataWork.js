import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import generatePlotWorkBody from 'utils/work/generatePlotWorkBody';
import { fetchWork } from 'utils/work/fetchWork';

const getClusterNames = (state) => {
  const clusterIds = state.cellSets.hierarchy.reduce(
    (acc, cellSet) => [...acc, ...cellSet.children.map((entry) => entry.key)],
    [],
  );

  const clusterNames = clusterIds?.map((clusterId) => state.cellSets.properties[clusterId].name);
  return clusterNames;
};

const fetchPlotDataWork = (
  experimentId,
  plotUuid,
  plotType,
) => async (dispatch, getState) => {
  let config = getState().componentConfig[plotUuid]?.config ?? initialPlotConfigStates[plotType];
  const clusterNames = getClusterNames(getState());
  const timeout = getTimeoutForWorkerTask(getState(), 'PlotData');
  console.error(clusterNames);
  config = {
    ...config,
    clusterNames,
  };

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
  } catch (e) {
    const errorMessage = handleError(e, endUserMessages.ERROR_FETCHING_PLOT_DATA);

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
