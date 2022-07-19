import { initialPlotConfigStates } from 'redux/reducers/componentConfig/initialState';
import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import { fetchWork } from 'utils/work/fetchWork';
import { plotTypes } from 'utils/constants';

const plotType = plotTypes.DOT_PLOT;

const getClusterNames = (state) => {
  const clusterIds = state.cellSets.hierarchy.reduce(
    (acc, cellSet) => [...acc, ...cellSet.children.map((entry) => entry.key)],
    [],
  );

  const clusterNames = clusterIds?.map((clusterId) => state.cellSets.properties[clusterId].name);
  return clusterNames;
};

const getDotPlotData = (
  experimentId,
  plotUuid,
) => async (dispatch, getState) => {
  const config = getState().componentConfig[plotUuid]?.config ?? initialPlotConfigStates[plotType];
  const clusterNames = getClusterNames(getState());
  const timeout = getTimeoutForWorkerTask(getState(), 'PlotData');

  const [filterGroup, filterKey] = config.selectedPoints.split('/');

  const body = {
    name: 'DotPlot',
    useMarkerGenes: config.useMarkerGenes,
    numberOfMarkers: config.nMarkerGenes,
    customGenesList: config.selectedGenes,
    groupBy: config.selectedCellSet,
    filterBy: {
      group: filterGroup,
      key: filterKey || 'All',
    },
    // clusterNames is used for triggering a work request upon cluster name change
    clusterNames,
  };

  try {
    dispatch({
      type: PLOT_DATA_LOADING,
      payload: { plotUuid },
    });

    const { data } = await fetchWork(
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

export default getDotPlotData;
