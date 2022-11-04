import getTimeoutForWorkerTask from 'utils/getTimeoutForWorkerTask';
import { PLOT_DATA_LOADED, PLOT_DATA_LOADING, PLOT_DATA_ERROR } from 'redux/actionTypes/componentConfig';

import handleError from 'utils/http/handleError';
import endUserMessages from 'utils/endUserMessages';
import fetchWork from 'utils/work/fetchWork';

const getClusterNames = (state) => {
  const clusterIds = state.cellSets.hierarchy.reduce(
    (acc, cellSet) => [...acc, ...cellSet.children.map((entry) => entry.key)],
    [],
  );

  const clusterNames = clusterIds?.map((clusterId) => state.cellSets.properties[clusterId].name);
  return clusterNames;
};

const transformToPlotData = (data) => {
  const result = [];

  data.cellSetsIdx.forEach((cellSetIdx, arrIdx) => {
    result.push({
      avgExpression: data.avgExpression[arrIdx],
      cellSets: data.cellSetsNames[cellSetIdx],
      cellsPercentage: data.cellsPercentage[arrIdx],
      geneName: data.geneNames[data.geneNameIdx[arrIdx]],
    });
  });

  return result;
};

const orderCellSets = (data, cellSets, config) => {
  // reordering data based on the sample order
  const { selectedCellSet } = config;
  const { hierarchy, properties } = cellSets;
  if (hierarchy.length) {
    const cellSetOrderKeys = hierarchy.filter((rootNode) => rootNode.key === selectedCellSet)[0]
      .children
      .map((cellSet) => cellSet.key);
    const cellSetOrderNames = cellSetOrderKeys.map((cellSet) => properties[cellSet].name);
    data.sort((a, b) => (
      cellSetOrderNames.indexOf(a.cellSets) - cellSetOrderNames.indexOf(b.cellSets)
    ));
  }
};

const getDotPlot = (
  experimentId,
  plotUuid,
  config,
) => async (dispatch, getState) => {
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

    const data = await fetchWork(
      experimentId, body, getState, dispatch, { timeout },
    );

    const plotData = transformToPlotData(data);
    orderCellSets(plotData, getState().cellSets, config);

    dispatch({
      type: PLOT_DATA_LOADED,
      payload: {
        plotUuid,
        plotData,
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

export default getDotPlot;
